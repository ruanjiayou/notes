FROM rabbitmq:3.10-management
COPY ./plugins/rabbitmq_delayed_message_exchange-3.10.2.ez /opt/rabbitmq/plugins/
RUN rabbitmq-plugins enable rabbitmq_delayed_message_exchange
