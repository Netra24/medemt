import json
import boto3
import re
import time
import base64
import email
from pprint import pprint
from datetime import datetime

s3 = boto3.client('s3')
ses = boto3.client("ses")

exports.handler = async (event) => {
     data = base64.b64decode(event['body'])
    content_type = event["headers"]['content-type']
    ct = "Content-Type: "+content_type+"\n"

    # parsing message from bytes
    msg = email.message_from_bytes(ct.encode()+data)

    # if message is multipart
    if msg.is_multipart():
        multipart_content = {}
        # retrieving form-data
        for part in msg.get_payload():
            if part.get_filename():
                file_name = part.get_filename()
            multipart_content[part.get_param('name', header='content-disposition')] = part.get_payload(decode=True)

    audio = multipart_content['file']
    key = datetime.now().strftime("%m%d%Y%H%M%S")
    ext = file_name.split('.')[1]
    fileName = key+'.'+ext
    
    emailid = multipart_content['mailid'].decode("utf-8") 
    regex = '^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'
    if(not re.search(regex,emailid)):  
        return {
            'statusCode': 200,
            'body': errorMsg,
            'headers': {
                'Content-Type': 'text/html'
            }
        }
    
    if(ext!='mp3' and ext!='mp4' and ext!='wav' and ext!='flac' and ext!='ogg' and ext!='amr' and ext!='webm'):
        return {
            'statusCode': 200,
            'body': errorAudio,
            'headers': {
                'Content-Type': 'text/html'
            }
        }
    data = s3.put_object(
        Bucket="medicalaudiofiles",
        Key=fileName,
        Body=audio,
        Metadata={'email':emailid}
    )   
    time.sleep(20)
    
    return {
        'statusCode': 200,
        'body': success,
        'headers': {
                'Content-Type': 'text/html'
            }
    }

    return {"message": "Successfully executed"};
};