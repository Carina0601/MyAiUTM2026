from flask import Flask
app= Flask(__name__)

@app.route('/')
def omdev():
    return 'Hello World'

app.run(debug=True)