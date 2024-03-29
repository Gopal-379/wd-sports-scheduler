"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Sport.hasMany(models.Session, {
        foreignKey: "sportId",
      });
    }

    static getSport() {
      return this.findAll();
    }

    static createsports({ sportName, userId }) {
      return this.create({
        sportName,
        userId,
      });
    }

    static editSport({ sportName, id }) {
      return this.update(
        {
          sportName,
        },
        {
          where: {
            id,
          },
        }
      );
    }

    static deleteSportById(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
  }
  Sport.init(
    {
      sportName: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sport",
    }
  );
  return Sport;
};
