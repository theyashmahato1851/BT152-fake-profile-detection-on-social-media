"""Train classifier: python model.py."""
from pathlib import Path
import json, joblib, pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
BASE=Path(__file__).resolve().parent; ART=BASE/'artifacts'
FIELDS=['statuses_count','followers_count','friends_count','favourites_count','listed_count']; FEATURES=FIELDS+['has_url','has_time_zone']
def prepare(path,label):
 raw=pd.read_csv(path); data=raw[FIELDS].apply(pd.to_numeric,errors='coerce'); present=lambda x:(~x.fillna('').astype(str).str.strip().str.lower().isin(['','nan','none','null'])).astype(int)
 data['has_url']=present(raw['url']); data['has_time_zone']=present(raw['time_zone']); data['label']=label; return data
def train():
 data=pd.concat([prepare(BASE/'real_twitter_accounts.csv',0),prepare(BASE/'fake_twitter_accounts.csv',1)],ignore_index=True)
 xt,xv,yt,yv=train_test_split(data[FEATURES],data.label,test_size=.25,random_state=42,stratify=data.label)
 pipe=Pipeline([('preprocessor',ColumnTransformer([('numeric',SimpleImputer(strategy='median'),FEATURES)])),('classifier',RandomForestClassifier(n_estimators=300,min_samples_leaf=2,class_weight='balanced',random_state=42,n_jobs=-1))])
 pipe.fit(xt,yt); p=pipe.predict(xv); ART.mkdir(exist_ok=True); joblib.dump(pipe,ART/'fake_profile_model.joblib')
 metrics={'dataset_size':len(data),'real_profiles':int((data.label==0).sum()),'fake_profiles':int((data.label==1).sum()),'test_size':len(xv),'accuracy':round(float(accuracy_score(yv,p)),4),'confusion_matrix':confusion_matrix(yv,p,labels=[0,1]).tolist(),'labels':{'0':'real','1':'fake'},'features':FEATURES,'random_state':42}
 (ART/'metrics.json').write_text(json.dumps(metrics,indent=2)); print(f"Saved model. Test accuracy: {metrics['accuracy']:.2%}"); print(metrics['confusion_matrix'])
if __name__=='__main__': train()
