module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    catalogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('dratf', 'published', 'forbidden')
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '来源url'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comments: '标题'
    },
    tags: {
      type: DataTypes.STRING,
      comments: '标签'
    },
    poster: {
      type: DataTypes.STRING,
      allowNull: true,
      comments: '封面'
    },
    content: {
      type: DataTypes.TEXT,
      comments: '内容'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comments: '创建日期'
    }
  }, {
      freezeTableName: false,
      underscoredAll: true,
      tableName: 'article',
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
    // await model.bulkCreate(data);
  }
  // instance method
  model.prototype.toJSON = function () {
    const res = this.dataValues;
    return res;
  };
  return model;
}