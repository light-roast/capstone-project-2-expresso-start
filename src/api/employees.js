const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(process.env.TEST_DATABASE || dbPath);

//Get all employees in DB
employeesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (err, employees) => {
        if (err) {
            next(err);
          } else {
            res.status(200).json({employees: employees});
          }
    })
  });


//Custom middleware to chek body info when posting a new employee
  const validateEmployeeFields = (req, res, next) => {
    const employee = req.body.employee;
    if (!employee || !employee.name || !employee.position || !employee.wage) {
        res.status(400).send('Missing required fields in the request body.');
    } else {
        next();
    }
};

//Post a new employee
employeesRouter.post('/', validateEmployeeFields, (req, res, next) => {
    const employee = req.body.employee;

    db.run('INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)', {
        $name: employee.name,
        $position: employee.position,
        $wage: employee.wage
    }, function (err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, employee) => {
                if (err) {
                    next(err);
                } else {
                    res.status(201).json({ employee: employee });
                }
            });
        }
    });
});

//Param middleware fot petitions with :employeeId
employeesRouter.param('employeeId', (req, res, next, id) => {
    const sql = 'SELECT * FROM Employee WHERE id = $id';
    const values = { $id: id };
  
    db.get(sql, values, (err, employee) => {
      if (err) {
        next(err);
      } else if (employee) {
        req.employee = employee;
        next();
      } else {
        res.status(404).send();
      }
    });
  });

//Get request for a custom employee with id
employeesRouter.get('/:employeeId', (req, res)=> {
    if (req.employee) {
        res.status(200).json({ employee: req.employee });
      } else {
        res.status(404).send();
      }
});




module.exports = employeesRouter;