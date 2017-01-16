import sys
sys.path.insert(1,'packages')

import boto3
from flask import Flask, request, redirect, flash, get_flashed_messages, render_template
from flask_debugtoolbar import DebugToolbarExtension

from jinja2 import Template
from jinja2 import Environment, PackageLoader, select_autoescape, FileSystemLoader
import logging
from datetime import datetime

dynamodbClient = boto3.client('dynamodb')
s3Client = boto3.client('s3')

logging.basicConfig(level=logging.INFO)


env = Environment(
    loader=FileSystemLoader('templates'),
    autoescape=select_autoescape(['html', 'xml'])
)

app = Flask(__name__)

app.debug = True

# set a 'SECRET_KEY' to enable the Flask session cookies
app.config['SECRET_KEY'] = 'my super secret flask key 7800942rjasdf'
app.config['DEBUG_TB_INTERCEPT_REDIRECTS']=False

toolbar = DebugToolbarExtension(app)


@app.route("/", methods=['GET', 'POST'])
def frontpage():
    logging.info("frontpage")
    logging.info(request)
    return render_template('home.html', message='Frontpage')

@app.route("/cms/", methods=['GET', 'POST'])
def cms():
    logging.info(request)

    result = dynamodbClient.scan(TableName='SmeltCMSContentType')
    logging.info(result)

    params={'smelt_public_websire_url': "http://smelt-dev-public.s3-website-ap-southeast-2.amazonaws.com/",
    'contentTypes':result.get('Items',[])}
    return render_template('cms.html', **params)

@app.route('/cms/generate', methods=['GET'])
def generate():
    now = datetime.now()
    body = "This file generated: %s - Hi there" % (str(now))

    response = s3Client.put_object(
        ACL='public-read',
        Body=body,
        Bucket='smelt-dev-public',
        ContentType='text/html',
        Key='index.html',
        StorageClass='STANDARD'
    )
    flash("file generated...")
    return redirect("/cms", code=302)

