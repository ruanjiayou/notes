const JSEncrypt = require('jsencrypt');

// const encryptor = new JSEncrypt();
// encryptor.setPublicKey(`-----BEGIN PUBLIC KEY-----
// MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCsMwDFK9QtawzMO7Df8clvO/gm
// VbpJ10CRz8uvq2pH4+700yURMgHWiMsIsUza0MPEgIffCAFtn4n0wk+arEcm2/vQ
// d+5ebe0urgpGjl64SST0BxMSNgOWHCmKe7jVNWx6OusSUasDD+ieXChjjMDAaoH0
// Qx2g2Lg5Zu00abJv+QIDAQAB
// -----END PUBLIC KEY-----`);
// const cipher = encryptor.encrypt('hello world');

const ticket = 'eXv32kvWwNY48iegGthHu/9182jqO9LOQ0AV8QjF7J93wXkwCK00HBvRu9HG4jKyvzWg9+HjlDHTJm9+Vo5OT9UFq6ffLeERbFY/zxUeUWzsQe47qvafs8hhlaw0X2xC2UqCJ0dBDPNwc4/Zy8cWW8756WAx+HwUsoQimUslAn8=';

const decryptor = new JSEncrypt();
decryptor.setPrivateKey(`-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCsMwDFK9QtawzMO7Df8clvO/gmVbpJ10CRz8uvq2pH4+700yUR
MgHWiMsIsUza0MPEgIffCAFtn4n0wk+arEcm2/vQd+5ebe0urgpGjl64SST0BxMS
NgOWHCmKe7jVNWx6OusSUasDD+ieXChjjMDAaoH0Qx2g2Lg5Zu00abJv+QIDAQAB
AoGBAJ1fR1brBVA0w09rReyEVil4TwMJ2eRd+j7H/0ieidUFtH6+8ONUJmXgQl3B
W5GmtSNCq+nisRt0cGnlo0aiJ6sV5mRo7bHx2nKzzBf1e7P3RLiAKvTQ0tAtybPB
A84CuZklayd3BrFw4G8nZY0f1vyttgUQNNgP72al06ce3q8BAkEA2UNy7RsD/40q
9vqRB0VeDaweBolrZj5oT64oA+nbVJq2sKBBiswqkLhzz+52hE2tT8NY760D1Qi8
GjPpyJWxEQJBAMrmsCPiiBK78SfHEvbEyP+wm1+FjX34ykIZtCDN7cV3UDnb1gH5
RFQhVaQiG5TzfKy289xyMZMHKOMfqd1/0GkCQGA6apWwCIZQnT4E3uVsiOrfV/En
PmVrsMHR7jFFi/qeB9qVMFJseVHeEJWBFgclbGTOrf6CEBd0JfQpGBvaiTECQHXB
aop5B0XwI2ZVh/EFhi22voWyicqJYED6j+rV+N+4fiwGJO7iTsCQ1BY84UsSANJw
H5laAOF2r0kZcEkny7kCQA4jTIVDOwAe3E6gsA0UmFltUnj0eb+7J1OaRvqL38cf
YBIHVNH47PsoeUhBEuQy5ShBuJpwWvlK7JSArdVl/RM=
-----END RSA PRIVATE KEY-----`);

const plain = decryptor.decrypt(ticket);

console.log(plain);
