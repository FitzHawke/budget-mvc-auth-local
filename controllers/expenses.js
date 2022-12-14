const Expense = require("../models/Expenses");
const Budget = require("../models/Budget");

const createExpense = async (req, res, next) => {
  try {
    // Parse the data submitted in the form
    let { amount, description } = req.body;
    amount = Number(amount) * 100;
    const user = req.user;
    // Create a document in 'expenses' collection
    await Expense.create({ amount, description, user: user.id });

    // Change the budget for the respective time period
    const budget = await Budget.findOne({ user: user.id });
      // $and: [
      //   { user: user.id },
      //   // { startDate: { $lte: date } },
      //   // { endDate: { $gte: date } },
      // ],
    // Update remaining budget
    if (budget) {
      await Budget.findOneAndUpdate(
        { _id: budget._id },
        {
          remainingAmount: budget.remainingAmount - amount,
        }
      );
    }

    console.log("Expense has been added!");
    res.redirect("/budget");
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res) => { //add trash can next to each expense in budget page.
  try {
    const expense = await Expense.findOne({ _id: req.body.idFromJSFile });

    // Add the amount of the expense back to the budget
    const budget = await Budget.findOne({ user: req.user._id });
    if (budget) {
      await Budget.findOneAndUpdate(
        { _id: budget._id },
        {
          remainingAmount: budget.remainingAmount + expense.amount,
        }
      );
    }

    // Delete the expense
    await Expense.deleteOne({
      _id: expense._id
    });

    console.log("Expense has been deleted and budget adjusted!");
    res.json('deleted')
  } catch (err) {
    console.log(err);
  }
};

const updateExpense = async (req, res) => { //need to add collapsable form next to each expense in budget page.
  try {
    const expenseId = req.params.id; //getting expense id from params
    const newAmount = Number(req.body.amount) * 100
    const newDescription = req.body.desc
    const initialExpense = await Expense.findOne({ _id: expenseId, user: req.user.id });

    // Update budget
    const budget = await Budget.findOne({ user: req.user._id });
    if (budget) {
      await Budget.findOneAndUpdate(
        { _id: budget._id },
        {
          remainingAmount: budget.remainingAmount + initialExpense.amount - newAmount,
        }
      );
    }

    // transaction object
    const update = {
      amount: newAmount,
      description: newDescription, 
      user: req.user.id,
    }

    const editedExpense = await Expense.findOneAndUpdate( {_id: expenseId}, update, {new: true} );
    
    console.log("Expense has been updated and budget adjusted!");
    res.json(editedExpense);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  createExpense,
  deleteExpense,
  updateExpense,
};
