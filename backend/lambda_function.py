import json
import boto3
import base64

REGION_NAME = 'ap-northeast-2'
BUCKET_NAME = 'face-rekognition-mc'

# client
s3 = boto3.client("s3", region_name=REGION_NAME)
rekognition = boto3.client("rekognition", region_name=REGION_NAME)

def lambda_handler(event, context):
    print(f">>>>>>>>>>>> 이벤트: {json.dumps(event, indent=4)}")
    body = json.loads(event["body"])
    username = body['username']
    image_data = body['image']
    auth_type = event["queryStringParameters"]["authType"]
    
    # Base64 디코딩
    image_binary = base64.b64decode(image_data)

    if auth_type == 'signup':
        try:
            # S3에 이미지 업로드
            signup_image_key = f"users/{username}_signup.jpg"
            s3.put_object(Bucket=BUCKET_NAME, Key=signup_image_key, Body=image_binary)
            return {
                'statusCode': 200,
                'body': json.dumps('Registered Successfully!')
            }
        except Exception as e:
            print(e)
            return {
                'statusCode': 500,
                'body': json.dumps('Error during user registration')
            }
    else: # user login
        try:
            login_image_key = f"users/{username}_login.jpg"
            s3.put_object(Bucket=BUCKET_NAME, Key=login_image_key, Body=image_binary)
            
            # Rekognition으로 얼굴 비교
            reko_response = rekognition.compare_faces(
                SimilarityThreshold=75,
                SourceImage={"S3Object": {"Bucket": BUCKET_NAME, "Name": f"users/{username}_signup.jpg"}},
                TargetImage={"S3Object": {"Bucket": BUCKET_NAME, "Name": login_image_key}}
            )
            
            # 로그인 이미지 삭제
            s3.delete_object(Bucket=BUCKET_NAME, Key=login_image_key)
            
            if len(reko_response["FaceMatches"]) == 0:
                return {
                    'statusCode': 401,
                    'body': json.dumps('Incorrect Credentials Provided')
                }
            elif reko_response["FaceMatches"][0]["Similarity"] > 85:
                return {
                    'statusCode': 200,
                    'body': json.dumps('Logged in successfully!')
                }
            else:
                return {
                    'statusCode': 401,
                    'body': json.dumps('Incorrect image!')
                }
        except Exception as e:
            print(e)
            return {
                'statusCode': 500,
                'body': json.dumps('Error during login. May be no such username.')
            }
