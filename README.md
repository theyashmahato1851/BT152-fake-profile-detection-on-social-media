# Fake Twitter/X Profile Detection

An academic ML prototype that estimates fake-profile risk from public Twitter/X account metadata. It includes a Streamlit interface, local sign-in, reproducible training, and evaluation output.

## Dataset and method

The included data contains 1,481 real and 1,337 fake labelled profiles. The model uses tweet count, followers, following, favourites, listed count, URL presence, and time-zone presence. Labels are `0 = real`, `1 = fake`.

`model.py` makes a stratified 75/25 train-test split (`random_state=42`) and trains a Random Forest in a scikit-learn pipeline. The same preprocessing runs during training and prediction, preventing mismatched inputs. It writes the trained model and metrics to `artifacts/`.

## Run on Windows

Install **Python 3.11 or 3.12** and tick **Add Python to PATH**. In Command Prompt, open this project folder and run:

```bat
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python model.py
streamlit run fake.py
```

Create an account, sign in, and enter public account statistics. The result is only a screening signal—not evidence to accuse, report, or ban a person.

## Limitations and future work

The data is historical and may contain bias or label errors. Metadata cannot establish identity or intent, so human review is essential. Future work: compare classifiers with precision/recall/F1/ROC-AUC, add model explainability, collect newer data, add tests and GitHub Actions, and deploy with Streamlit Community Cloud or Render.
