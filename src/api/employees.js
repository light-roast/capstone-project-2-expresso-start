const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(process.env.TEST_DATABASE || dbPath);
const timesheetsRouter = require('./timesheets');

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


employeesRouter.put('/:employeeId', validateEmployeeFields, (req, res, next) => {
    const employeeId = req.params.employeeId;
    const requestData = req.body.employee;
    const isCurrentEmployee = requestData.isCurrentEmployee === 0 ? 0 : 1;
    db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $current WHERE id = $id',
    {$name: requestData.name,
    $position: requestData.position,
    $wage: requestData.wage,
    $current: isCurrentEmployee,
    $id: employeeId
}, (err) => {
    if(err) {
        next(err);
        res.status(500).send('Internal Server Error. Update failed.');
        return;
    }

    db.get('SELECT * FROM Employee WHERE id = $id', {$id: employeeId}, (error, row) => {
        if (error) {
          next(error);
          res.status(500).send('Internal Server Error. Failed to retrieve updated artist.');
        } if (!row) {
            res.status(404).send('Employee not found.');
        } else {
            res.status(200).send({ employee: row });
        }
      })
}

)
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run('UPDATE Employee SET is_current_employee = 0 WHERE id = $id', {$id: req.params.employeeId},
    (err) => {
        if(err) {
            next(err);
            res.status(500).send('Internal server error. Deletion failed');
            return;
        }
        db.get('SELECT * FROM Employee WHERE id = $id', {$id: req.params.employeeId}, (error, row) => {
            if(error) {
                next(error);
                res.status(500).send('Failed to retrieve deleted artist.');
            } else {
                res.status(200).send({employee: row});
            }
        });
    });
}

);

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter)



module.exports = employeesRouter;