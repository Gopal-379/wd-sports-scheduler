"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class participantSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      participantSession.belongsTo(models.User, {
        foreignKey: "playerId",
      });
      participantSession.belongsTo(models.Session, {
        foreignKey: "sessionId",
      });
    }

    static getSessionByPlayerId(playerId) {
      return this.findAll({
        where: {
          playerId,
        },
      });
    }

    static async deleteSession(sessionId) {
      return this.destroy({
        where: {
          sessionId,
        },
      });
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static async removeBysessionId(sessionId, playerId) {
      return this.destroy({
        where: {
          sessionId,
          playerId,
        },
      });
    }
  }
  participantSession.init(
    {
      participants: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "participantSession",
    }
  );
  return participantSession;
};
