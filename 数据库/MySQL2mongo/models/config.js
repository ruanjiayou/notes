module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Config', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '配置名'
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '配置值'
    },
    type: {
      type: DataTypes.ENUM('int', 'string', 'json', 'array'),
      allowNull: true
    },
    mark: {
      type: DataTypes.STRING
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'config',
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
      { name: 'PROJECT_NAME', value: 'project-test', type: "string", mark: "pm2项目名称" },
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