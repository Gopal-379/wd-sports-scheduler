'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Session.belongsTo(models.Sport, {
        foreignKey: "sportId",
      });
      Session.hasMany(models.participantSession, {
        foreignKey: "sessionId",
      });
    }
  }
  Session.init({
    date: DataTypes.DATEONLY,
    time: DataTypes.TIME,
    venue: DataTypes.STRING,
    playerNums: DataTypes.INTEGER,
    sessionName: DataTypes.STRING,
    sessionCancelled: DataTypes.BOOLEAN,
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};