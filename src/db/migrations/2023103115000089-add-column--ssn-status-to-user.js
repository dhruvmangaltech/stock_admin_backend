'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('users', 'ssn_status', {
      type: DataTypes.STRING,
      allowNull: true
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'ssn_status')
  }
}
