const fs = require('fs');
const path = require('path');

describe('Controller architecture boundaries', () => {
  it('does not import Mongoose models directly from controllers', () => {
    const controllersDir = path.join(__dirname, '..', 'src', 'controllers');
    const violations = fs.readdirSync(controllersDir)
      .filter((file) => file.endsWith('.js'))
      .flatMap((file) => {
        const source = fs.readFileSync(path.join(controllersDir, file), 'utf8');
        return source.includes('../models') ? [file] : [];
      });

    expect(violations).toEqual([]);
  });
});
