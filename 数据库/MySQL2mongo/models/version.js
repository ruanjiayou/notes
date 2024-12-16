module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Version', {
    id: {
      type: DataTypes.INTEGER(20),
      field: 'id',
      unique: true,
      primaryKey: true,
      autoIncrement: true
    },
    cid: {
      type: DataTypes.INTEGER(20),
      field: 'c_id',
    },
    password: {
      type: DataTypes.STRING(50),
      field: 'password',
      defaultValue: ''
    },
    time: {
      type: DataTypes.DATE,
      field: 'time',
      defaultValue: DataTypes.NOW
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'version',
      charset: 'utf8',
      initialAutoIncrement: 1,
      timezone: '+08:00',
      paranoid: false,
      timestamps: false,
      indexes: []
    });
  // class method

  // 表间的关系
  model.associate = (models) => {

  }
  // 表的初始化数据
  model.seed = async () => {
    const data = [];
    await model.bulkCreate(data);
  }
  // instance method

  model.prototype.toJSON = function () {
    const res = this.dataValues;
    return res;
  };
  return model;
}