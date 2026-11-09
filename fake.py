"""Run with: streamlit run fake.py"""
from pathlib import Path
import json, sqlite3, hashlib, hmac, os, joblib, pandas as pd, streamlit as st
from PIL import Image
BASE=Path(__file__).resolve().parent; DB=BASE/'data.db'; MODEL=BASE/'artifacts/fake_profile_model.joblib'; METRICS=BASE/'artifacts/metrics.json'
def db(): return sqlite3.connect(DB)
def setup():
    with db() as c: c.execute('CREATE TABLE IF NOT EXISTS userstable (username TEXT PRIMARY KEY,password TEXT NOT NULL)')
def hashed(p,s=None):
    s=s or os.urandom(16).hex(); return f'pbkdf2_sha256${s}$'+hashlib.pbkdf2_hmac('sha256',p.encode(),s.encode(),200000).hex()
def verify(p,h):
    if h.startswith('pbkdf2_sha256$'):
        _,s,_=h.split('$',2); return hmac.compare_digest(hashed(p,s),h)
    return hmac.compare_digest(hashlib.sha256(p.encode()).hexdigest(),h)
@st.cache_resource
def load_model(): return joblib.load(MODEL)
def main():
    st.set_page_config(page_title='Fake Profile Detection',page_icon='🔎'); setup(); st.title('Fake Twitter/X Profile Detection')
    if (BASE/'F.jpeg').exists(): st.image(Image.open(BASE/'F.jpeg'),width=420)
    if not METRICS.exists(): st.warning('Run `python model.py` first.'); st.stop()
    st.caption(f"Prototype trained on {json.loads(METRICS.read_text())['dataset_size']:,} labelled profiles.")
    if not st.session_state.get('auth'):
        a,b=st.tabs(['Sign in','Create account'])
        with a:
            with st.form('login'):
                u=st.text_input('Username'); p=st.text_input('Password',type='password')
                if st.form_submit_button('Sign in'):
                    with db() as c: row=c.execute('SELECT password FROM userstable WHERE username=?',(u.strip(),)).fetchone()
                    if row and verify(p,row[0]): st.session_state.auth=True; st.rerun()
                    else: st.error('Invalid username or password.')
        with b:
            with st.form('signup'):
                u=st.text_input('New username'); p=st.text_input('New password',type='password')
                if st.form_submit_button('Create account'):
                    try:
                        if len(u.strip())<3 or len(p)<8: raise ValueError('Username needs 3+ characters; password needs 8+.')
                        with db() as c: c.execute('INSERT INTO userstable VALUES (?,?)',(u.strip(),hashed(p)))
                        st.success('Account created. Sign in now.')
                    except (sqlite3.IntegrityError,ValueError) as e: st.error(str(e))
        return
    st.subheader('Analyse an account'); st.caption('Screening estimate only—not proof of deception.')
    with st.form('prediction'):
        a,b=st.columns(2); v={'statuses_count':a.number_input('Posts / tweets',0,step=1),'followers_count':b.number_input('Followers',0,step=1),'friends_count':a.number_input('Following',0,step=1),'favourites_count':b.number_input('Favourites / likes',0,step=1),'listed_count':a.number_input('Listed count',0,step=1),'has_url':int(b.checkbox('Profile has a URL')),'has_time_zone':int(a.checkbox('Time-zone information is available'))}; run=st.form_submit_button('Check profile',type='primary')
    if run:
        prob=float(load_model().predict_proba(pd.DataFrame([v]))[0,1]); st.metric('Estimated probability of a fake profile',f'{prob:.1%}')
        (st.error if prob>=.5 else st.success)('Potentially fake: review manually.' if prob>=.5 else 'Likely genuine according to this model; not a guarantee.')
if __name__=='__main__': main()
