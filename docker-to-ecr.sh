docker build -t eko-bot-demo:master .
docker tag eko-bot-demo:master 826057481178.dkr.ecr.ap-southeast-1.amazonaws.com/eko-bot-demo:master
docker push 826057481178.dkr.ecr.ap-southeast-1.amazonaws.com/eko-bot-demo:master
