// deals with any data needed
var budgetController = (function(){

  var Expense = function(id, description, value){
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  }

  // add a extra method to Expense to display percentages next to each item
  Expense.prototype.calcPercentage = function(totalIncome){
    if(totalIncome > 0){
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  }

  Expense.prototype.getPercentage = function(){
    return this.percentage;
  }

  var Income = function(id, description, value){
    this.id = id;
    this.description = description;
    this.value = value;
  }

  var calculateTotal = function(type){
    var sum = 0;

    data.allItems[type].forEach(function(element){
      sum += element.value;
    });

    data.totals[type] = sum;
  }

  var data = {
      allItems: {
        exp: [],
        inc: []
      },
      totals: {
        exp: 0,
        inc: 0
      },
      budget: 0,
      percentage: -1
    }

    return {
      addItem: function(type, des, val){
        var newItem, ID;

        if(data.allItems[type].length > 0){
          // Get the last ID in the array and add one
          ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
        } else {
          ID = 0;
        }

        if(type === 'exp'){
          newItem = new Expense(ID, des, val);
        } else if(type === 'inc'){
          newItem = new Income(ID, des, val);
        }

        data.allItems[type].push(newItem);
        return newItem;
      },

      // the arrays of ids may not be in order so need to find the correct position
      // of the ID you are trying to delete
      deleteItem: function(type, id){
        var ids, index;

        // returns all ids within array
        ids = data.allItems[type].map(function(element){
          return element.id;
        });

        index = ids.indexOf(id);
        if(index !== -1){
          data.allItems[type].splice(index, 1);
        }
      },

      calulateBudget: function(){
        // calculate total income and expenses
        calculateTotal('exp');
        calculateTotal('inc');

        // calculate the budget: income - expenses

        data.budget = data.totals.inc - data.totals.exp;

        // calulate the percentage of income that we spent
        if(data.totals.inc > 0){
          data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
        } else {
          data.percentage = -1;
        }
      },

      calculatePercentages: function(){
        data.allItems.exp.forEach(function(element){
          element.calcPercentage(data.totals.inc);
        });
      },

      getPercentages: function(){
        var allPerc = data.allItems.exp.map(function(element){
          return element.getPercentage();
        });
        return allPerc;
      },

      getBudget: function(){
        return {
          budget: data.budget,
          totalInc: data.totals.inc,
          totalExp: data.totals.exp,
          percentage: data.percentage
        }
      },

      testing: function(){
        console.log(data);
      }
    }
  })();

// deals changing UI
var UIController = (function() {

  // Class names from HTML
  var DomStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expenseLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  }

  var formatNumbers = function(num, type){
    var num, numSplit, int, sign;

    // 3000 -> 3,000.00
    num = Math.abs(num);
    // adds the 2 decimals
    num = num.toFixed(2);

    numSplit = num.split('.');

    int = numSplit[0];
    if(int.length > 3) {
      // 3000 -> 3,300  (4-3 = 1)
      // 300000 -> 300,000  (6-3 = 3)
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    }

    dec = numSplit[1];

    sign = ((type === 'exp') ? '-' : '+');
    return sign + ' ' + int + '.' + dec;
  }

  var nodeListForEach = function(list, callback){
    for(var i = 0; i < list.length; i++){
      callback(list[i], i);
    }
  }

  return {
    // Get elements from HTML
    getInput: function(){
      return {
        type: document.querySelector(DomStrings.inputType).value,
        description: document.querySelector(DomStrings.inputDescription).value,
        // turn sting into a number
        value: parseFloat(document.querySelector(DomStrings.inputValue).value)
      }
    },

    // display new item under income and expenses UI
    addListItem: function(obj, type){
      var html, element;

      // Create HTML string with placeholder text
      if(type === 'inc'){
        element = DomStrings.incomeContainer;
        html = `<div class="item clearfix" id="inc-${obj.id}">
                  <div class="item__description">${obj.description}</div>
                  <div class="right clearfix">
                      <div class="item__value">%value%</div>
                      <div class="item__delete">
                          <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                      </div>
                  </div>
                </div>`;
      } else if(type === 'exp'){
        element = DomStrings.expensesContainer;
        html = `<div class="item clearfix" id="exp-${obj.id}">
                  <div class="item__description">${obj.description}</div>
                  <div class="right clearfix">
                      <div class="item__value">%value%</div>
                      <div class="item__percentage">21%</div>
                      <div class="item__delete">
                          <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                      </div>
                  </div>
                </div>`;
      }

      // Replace the placeholder text with some actual data
      // newHtml = html.replace('%id%', obj.id);
      // newHtml = html.replace('%description%', obj.description);
      newHtml = html.replace('%value%', formatNumbers(obj.value, type));

      // Insert the HTML into the DOM
      // there are 4 different insertAdjacentHTML 'names' you can use
      // - https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    // can only remove a child from a parent
    deleteListItem: function(selectorID){
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);
    },

    // reset input fields
    clearFields : function(){
      var fields, fieldsArr;

      fields = document.querySelectorAll(DomStrings.inputDescription + ', ' + DomStrings.inputValue);

      // call allows fields list to use slice method
      // slice can turn a list into an array
      fieldsArr = Array.prototype.slice.call(fields);

      // reset all values in array
      fieldsArr.forEach(function(element, index, array){
        element.value = "";
      });

      // draw focus to type inside the description input
      fieldsArr[0].focus();
    },

    displayBudget: function(obj){
      var type = ((obj.budget > 0) ? 'inc' : 'exp');

      document.querySelector(DomStrings.budgetLabel).textContent = formatNumbers(obj.budget, type);
      document.querySelector(DomStrings.incomeLabel).textContent = formatNumbers(obj.totalInc, 'inc');
      document.querySelector(DomStrings.expenseLabel).textContent = formatNumbers(obj.totalExp, 'exp');

      if(obj.percentage > 0){
        document.querySelector(DomStrings.percentageLabel).textContent = obj.percentage + '%';
      } else {
        document.querySelector(DomStrings.percentageLabel).textContent = "---";
      }
    },

    displayPercentages: function(percentages){
      var fields = document.querySelectorAll(DomStrings.expensesPercLabel);

      nodeListForEach(fields, function(current, index){
        if(percentages[index] > 0){
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }
      });
    },

    displayMonth: function(){
      var currentDate, year, month;

      currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.toLocaleString('default', {month: 'long'});
      document.querySelector(DomStrings.dateLabel).textContent = month + ' ' + year;
    },

    changeType: function(){
      var fields = document.querySelectorAll(
        DomStrings.inputType + ',' +
        DomStrings.inputDescription + ',' +
        DomStrings.inputValue
      );

      nodeListForEach(fields, function(element){
        element.classList.toggle('red-focus');
      });

      document.querySelector(DomStrings.inputBtn).classList.toggle('red');
    },

    getDomStrings: function(){
      return DomStrings;
    }
  }

})();

// deals with any interaction
var controller = (function(budgetCtrl, UICtrl) {

  // Listens for any interaction from user
  var setupEventListeners = function(){
    var DOM = UICtrl.getDomStrings();

    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    document.addEventListener('keypress', function(event){

      // check that enter was press, 13 = Enter
      // which is for older browsers
      if(event.keyCode === 13 || event.which === 13){
        ctrlAddItem();
      }

    });

    // access to anything that was clicked in the container
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType)
  }

  var updateBudget = function() {
    // 1. Calculate the budget
    budgetCtrl.calulateBudget();
    // 2. Return the budget
    var budget = budgetCtrl.getBudget();
    // 3. display the budget on the UI
    UICtrl.displayBudget(budget);
  }

  var updatePercentages = function(){
    // 1. Calculate updatePercentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentages from budget budgetController
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  }

  var ctrlAddItem = function(){
    var input, newItem;

    // 1. Get the field input data
    input = UICtrl.getInput();

    // isNaN = is not a number
    if(input.description !== "" && !isNaN(input.value) && input.value > 0){
      // 2. Add the item to the budget budgetController
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear fields
      UICtrl.clearFields();

      // 5. Calulate and update budget
      updateBudget();

      // 6. Calculate and update updatePercentages
      updatePercentages();
    }
  }

  var ctrlDeleteItem = function(event){
    var itemID, splitID, type, ID;

    // access the 4th parent up from the element that was clicked
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if(itemID){
      // EX: inc-0 -> ['inc','0']
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. delete item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete item from the UI
      UICtrl.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update updatePercentages
      updatePercentages();
    }
  }

  return {
    init: function() {
      console.log('Application has started.');
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });
      setupEventListeners();
    }
  }

})(budgetController, UIController);

controller.init();
