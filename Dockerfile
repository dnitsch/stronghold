FROM amd64/node:dubnium

# Optional: ENV {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_PROFILE, AWS_REGION}, PM2_env

ENV AWS_REGION eu-west-1
ENV SCM_FQDN gitlab.bootstrap.atoshcp.net
ENV ANSIBLE_VERSION 2.7.4
ENV TERRAFORM_VERSION 0.11.8
ENV ANSIBLE_PROVIDER_VERSION 0.0.4
ENV PM2_env dev
ENV WORKDIR /var/idam/control-plane/business/stronghold

RUN mkdir -p ${WORKDIR} \
             /var/idam/infrastructure/keys \
             /var/idam-test-clone \
             /var/idam-clone \
             /usr/local/bin \
             ~/.terraform.d/plugins

RUN apt-get update \
    && apt-get install -y unzip python-dev \
    && wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip \
    && unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip \
    && mv terraform /usr/local/bin \
    && wget https://github.com/nbering/terraform-provider-ansible/releases/download/v${ANSIBLE_PROVIDER_VERSION}/terraform-provider-ansible-linux_amd64.zip \
    && unzip terraform-provider-ansible-linux_amd64.zip \
    && mv linux_amd64 ~/.terraform.d/plugins \
    && npm install pm2 -g \
    && wget https://bootstrap.pypa.io/get-pip.py \
    && python get-pip.py \
    && pip install awscli \
    && pip install ansible==${ANSIBLE_VERSION} \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . ${WORKDIR}

WORKDIR /var/idam/control-plane/business/stronghold

RUN chmod +x bin/init.sh \
    && npm i \
    && npm cache clean --force

CMD [ "bin/init.sh" ]
EXPOSE 1337
