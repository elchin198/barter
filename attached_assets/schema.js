// schema.js
module.exports = {
  UserSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'email'],
  },

  ProductSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      description: { type: 'string' },
      category: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'price'],
  }
};
