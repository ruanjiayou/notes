## kafka命令
- 查看topics： `./kafka-topics.sh --list --zookeeper 127.0.0.1:2181`
- topic详情：`./kafka-topics.sh --list --zookeeper 127.0.0.1:2181 --describe --topic xxx`
- 创建消费者： `./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic xxx --from-beginning`
- 