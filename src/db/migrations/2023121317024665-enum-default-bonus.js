'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.sequelize.query("ALTER TYPE \"public\".\"enum_bonus_bonus_type\" ADD VALUE 'default-bonus';")
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}