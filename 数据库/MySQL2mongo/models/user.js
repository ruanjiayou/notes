const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    account: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '账号名'
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '昵称'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comments: '邮箱'
    },
    openid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: 'authority & signature'
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comments: '手机号'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '123456',
      comments: '密码'
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '123456789abcdefg',
      comments: '随机盐'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '头像'
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comments: '是否审核通过'
    },
    forbidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comments: '是否封号'
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comments: '是否是管理员'
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'user',
      charset: 'utf8',
      initialAutoIncrement: 1,
      timezone: '+08:00',
      paranoid: false,
      timestamps: true,
      indexes: []
    });
  // class method
  model.calculatePSW = function (password, salt) {
    const hmac = crypto.createHmac('sha1', salt);
    hmac.update(password);
    return hmac.digest('hex');
  }
  // 表间的关系
  model.associate = (models) => {

  }
  // 表的初始化数据
  model.seed = async () => {
    const t = Date.now().toString();
    const data = [
      { account: 'admin', nickname: 'admin', phone: '18888888888', password: model.calculatePSW('123456', t), salt: t, approved: true, admin: true }
    ];
    await model.bulkCreate(data);
  }
  // instance method
  model.prototype.comparePSW = function (password) {
    return this.password === model.calculatePSW(password, this.salt);
  };
  model.prototype.toJSON = function () {
    const res = this.dataValues;
    return res;
  };
  return model;
}