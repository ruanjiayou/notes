module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Code', {
    id: {
      type: DataTypes.INTEGER(20),
      field: 'id',
      unique: true,
      primaryKey: true,
      autoIncrement: true
    },
    uid: {
      type: DataTypes.INTEGER(20),
      field: 'uid',
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      field: 'name',
      allowNull: false,
      defaultValue: ''
    },
    account: {
      type: DataTypes.STRING(255),
      field: 'account',
      allowNull: false,
      defaultValue: ''
    },
    mark: {
      type: DataTypes.STRING(255),
      field: 'mark',
      defaultValue: ''
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'code',
      charset: 'utf8',
      initialAutoIncrement: 1,
      timezone: '+08:00',
      paranoid: true,
      timestamps: true,
      createdAt: false,
      updatedAt: false,
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