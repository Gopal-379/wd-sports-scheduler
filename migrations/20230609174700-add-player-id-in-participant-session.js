'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("participantSessions", "playerId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("participantSessions", {
      fields: ["playerId"],
      type: "foreign key",
      references: {
        table: "Users",
        field: "id",
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("participantSessions", "playerId");
  }
};
