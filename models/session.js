"use strict";
const { Model, Op } = require("sequelize");
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
    static createSession({
      sessionName,
      date,
      time,
      venue,
      playerNums,
      userId,
      sportId,
    }) {
      return this.create({
        sessionName,
        date,
        time,
        venue,
        playerNums,
        userId,
        sportId,
      });
    }
    static findPlayerSessionsById(userId, sportId) {
      return this.findAll({
        where: {
          userId,
          sportId,
        },
      });
    }

    static async findSportById(sportId) {
      return this.findAll({
        where: {
          sportId,
        },
      });
    }

    static async findSessionById(sessId) {
      return this.findAll({
        where: {
          id: sessId,
        },
      });
    }

    static async filterUpcomingSessions(sportSessions) {
      const curr = new Date();
      const upComing = sportSessions.filter(
        (s) => new Date(`${s.date} ${s.time}`) >= curr
      );
      return upComing;
    }

    static async getUncancelledSessionsFilteredByCancellationStatus(sessions) {
      return sessions.filter((s) => s.sessionCancelled === null);
    }

    static async deleteSession(sportId) {
      return this.destroy({
        where: {
          sportId,
        },
      });
    }

    static async increaseCount(sess) {
      return sess.update({ playerNums: sess.playerNums + 1 });
    }

    static async decreaseCount(sess) {
      return sess.update({ playerNums: sess.playerNums - 1 });
    }
  }
  Session.init(
    {
      date: DataTypes.DATEONLY,
      time: DataTypes.TIME,
      venue: DataTypes.STRING,
      playerNums: DataTypes.INTEGER,
      sessionName: DataTypes.STRING,
      sessionCancelled: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Session",
    }
  );
  return Session;
};
