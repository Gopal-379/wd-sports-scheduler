'use strict';
const {
  Model
} = require('sequelize');
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
    }

    static getSport(userId) {
      return this.findAll({
        where: {
          userId,
        },
        order: [["id", "ASC"]],
      });
    }

    static createsports({ sportName, userId }) {
      return this.create({
        sportName,
        userId,
      });
    }

    static editSport({ sportName, id }) {
      return this.update({
        sportName,
      }, {
        where: {
          id,
        },
      });
    }

    static deleteSport(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
  }
  Sport.init({
    sportName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};