module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Catelog', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    pid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '上级id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '分类名称'
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'catelog',
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
    const data = [
      { id: 1, pid: 0, name: '全部' }
    ];
    await model.bulkCreate(data);
  }
  // instance method
  model.prototype.toJSON = function () {
    const res = this.dataValues;
    return res;
  };
  return model;
}