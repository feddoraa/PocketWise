'use strict';

// PocketWise v1: 100% client-side. No server, login, or bank connection.
const TX_KEY = 'pocketwise.transactions.v1';
const BUDGET_KEY = 'pocketwise.budgets.v1';
const SAVINGS_KEY = 'pocketwise.savingsGoals.v1';

const categories = {
  expense: [
    'Food & Drinks', 
    'Transport', 
    'University', 
    'Shopping', 
    'Bills', 
    'Subscriptions',
    'Entertainment', 
    'Health', 
    'Other'
  ],
  income: [
    'Allowance', 
    'Part-time Job', 
    'Freelance', 
    'Gift', 
    'Other'
  ]
};
const symbols = {
  'Food & Drinks':'☕', 'Transport':'🚌', 'University':'📚', Shopping:'🛍', Bills:'🧾',Subscriptions: '🎵',
  Entertainment:'🎧', Health:'♡', Other:'◈', Allowance:'💵', 'Part-time Job':'💼', Freelance:'💻', Gift:'🎁'
};

const $ = (selector) => document.querySelector(selector);
const fmt = (amount) => new Intl.NumberFormat('en-JO', {
  style:'currency', currency:'JOD', minimumFractionDigits:3, maximumFractionDigits:3
}).format(amount);
const localDate = (date=new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const currentMonth = () => localDate().slice(0,7);

function safeRead(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch { return fallback; }
}
function safeSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { alert('Could not save data in this browser. Please check storage settings.'); return false; }
}

let transactions = safeRead(TX_KEY, []);
if (!Array.isArray(transactions)) transactions = [];
transactions = transactions.filter(t => t && typeof t.id === 'string' && ['income','expense'].includes(t.type)
  && Number.isFinite(t.amount) && t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date)
  && typeof t.description === 'string' && typeof t.category === 'string');
let budgets = safeRead(BUDGET_KEY, {});
if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) budgets = {};
let savingsGoals = safeRead(SAVINGS_KEY, {});

if (!savingsGoals || typeof savingsGoals !== 'object' || Array.isArray(savingsGoals)) {
  savingsGoals = {};
}
$('#monthPicker').value = currentMonth();
$('#dateInput').value = localDate();

function refreshCategories() {
  const select = $('#categoryInput');
  select.replaceChildren();
  categories[$('#typeInput').value].forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function selectedTransactions() {
  return transactions.filter(t => t.date.startsWith($('#monthPicker').value));
}
function sum(items) { return items.reduce((acc,t) => acc+t.amount,0); }
function message(value, error=false) {
  $('#formMessage').textContent = value;
  $('#formMessage').classList.toggle('error',error);
}

function drawTransactions(monthItems) {
  const needle = $('#searchInput').value.trim().toLowerCase();
  const filter = $('#typeFilter').value;
  const visible = monthItems.filter(t => (filter === 'all' || t.type === filter)
    && `${t.description} ${t.category}`.toLowerCase().includes(needle))
    .sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const list = $('#transactionList');
  list.replaceChildren();
  $('#transactionCount').textContent = `${visible.length} transaction${visible.length===1?'':'s'}`;
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-icon" aria-hidden="true">✳</span>No transactions to show yet.<div>Add one on the right, or try sample data.</div>';
    list.appendChild(empty);
    return;
  }
  visible.forEach(t => {
    const row = document.createElement('article'); row.className='transaction';
    const ico = document.createElement('span'); ico.className='tx-symbol'; ico.textContent=symbols[t.category] || '◈';
    ico.setAttribute('aria-hidden','true');
    const info = document.createElement('div'); info.className='tx-info';
    const title = document.createElement('div'); title.className='tx-title'; title.textContent=t.description;
    const detail = document.createElement('div'); detail.className='tx-detail'; detail.textContent=`${t.category} · ${t.date}`;
    info.append(title,detail);
    const right = document.createElement('div'); right.className='tx-right';
    const amount = document.createElement('div'); amount.className=`tx-amount ${t.type}`;
    amount.textContent=`${t.type==='income'?'+':'−'} ${fmt(t.amount)}`;
    const remove = document.createElement('button'); remove.type='button'; remove.className='delete-button';
    remove.textContent='Delete'; remove.setAttribute('aria-label',`Delete ${t.description}`);
    remove.addEventListener('click',() => {
      if (!window.confirm(`Delete “${t.description}”?`)) return;
      const updated = transactions.filter(item => item.id !== t.id);
      if (safeSave(TX_KEY, updated)) { transactions=updated; render(); }
    });
    right.append(amount,remove); row.append(ico,info,right); list.appendChild(row);
  });
}

function drawCategories(expenses) {
  const wrapper=$('#categoryBreakdown'); wrapper.replaceChildren();
  if (!expenses.length) {
    const empty=document.createElement('div'); empty.className='empty-state';
    empty.textContent='Your spending breakdown will appear here.'; wrapper.appendChild(empty); return;
  }
  const totals={}; expenses.forEach(t => { totals[t.category]=(totals[t.category]||0)+t.amount; });
  const total=sum(expenses);
  Object.entries(totals).sort((a,b)=>b[1]-a[1]).forEach(([category,value]) => {
    const item=document.createElement('div'); item.className='breakdown-item';
    const heading=document.createElement('div'); heading.className='breakdown-heading';
    const name=document.createElement('span'); name.textContent=`${symbols[category]||'◈'}  ${category}`;
    const figure=document.createElement('span'); figure.textContent=`${fmt(value)} · ${Math.round(value/total*100)}%`;
    heading.append(name,figure);
    const track=document.createElement('div'); track.className='mini-track';
    const fill=document.createElement('div'); fill.className='mini-fill'; fill.style.width=`${value/total*100}%`;
    track.appendChild(fill); item.append(heading,track); wrapper.appendChild(item);
  });
}
function drawAnalytics(income, expenses) {

  // Calculate total expenses
  const spent = sum(expenses);

  // Find the largest value for chart scaling
  const scale = Math.max(income, spent, 1);

  // Display financial values
  $('#analyticsIncome').textContent = fmt(income);
  $('#analyticsExpenses').textContent = fmt(spent);

  // Update chart bars
  $('#incomeBar').style.width =
    `${(income / scale) * 100}%`;

  $('#expensesBar').style.width =
    `${(spent / scale) * 100}%`;

  // Calculate spending by category
  const totals = {};

  expenses.forEach(transaction => {
    totals[transaction.category] =
      (totals[transaction.category] || 0) + transaction.amount;
  });

  // Find the highest spending category
  const topCategory = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])[0];

  // Display the result
  $('#topCategoryInsight').textContent = topCategory
    ? `Your highest spending category is ${topCategory[0]} (${fmt(topCategory[1])}).`
    : 'Add expenses to see your top spending category.';
}
function drawBudget(spent) {
  const month=$('#monthPicker').value;
  const budget=Number(budgets[month]);
  const hasBudget=Number.isFinite(budget)&&budget>0;
  $('#budgetInput').value=hasBudget?String(budget):'';
  $('#budgetSpent').textContent=`${fmt(spent)} spent`;
  $('#budgetLimit').textContent=hasBudget?`of ${fmt(budget)}`:'No budget set';
  const percent=hasBudget?spent/budget*100:0;
  const progress=$('#budgetProgress');
  progress.setAttribute('aria-valuenow',String(Math.round(Math.min(percent,100))));
  progress.setAttribute('aria-valuetext',hasBudget?`${Math.round(percent)} percent of budget spent`:'No budget set');
  progress.classList.toggle('over',percent>100);
  $('#budgetBar').style.width=`${Math.min(percent,100)}%`;
  $('#budgetHint').textContent=!hasBudget?'Set your monthly budget to track your progress.'
    :percent>100?`Over budget by ${fmt(spent-budget)}. Review your spending.`
    :`${fmt(Math.max(0,budget-spent))} left to spend this month.`;
}
function drawSavingsGoal(net) {
  const month = $('#monthPicker').value;

  const goal = Number(savingsGoals[month]);
  const hasGoal = Number.isFinite(goal) && goal > 0;

  // Calculate potential savings
  const available = Math.max(0, net);

  // Calculate progress percentage
  const percent = hasGoal ? (available / goal) * 100 : 0;

  // Display the goal
  $('#savingsGoalInput').value = hasGoal ? String(goal) : '';

  $('#savingsProgressText').textContent =
    `${fmt(available)} potential savings`;

  $('#savingsGoalText').textContent =
    hasGoal ? `of ${fmt(goal)} goal` : 'No goal set';

  // Update progress bar
  const progress = $('#savingsProgress');

  progress.setAttribute(
    'aria-valuenow',
    String(Math.round(Math.min(percent, 100)))
  );

  $('#savingsBar').style.width =
    `${Math.min(percent, 100)}%`;

  // Display a helpful message
  $('#savingsHint').textContent =
    !hasGoal
      ? 'Set your monthly savings target.'
      : net < 0
        ? `Your expenses exceed your income by ${fmt(Math.abs(net))}.`
        : percent >= 100
          ? 'You have reached your savings goal!'
          : `${fmt(goal - available)} more to reach your goal.`;
}

function render() {
  const items=selectedTransactions();
  const income=sum(items.filter(t=>t.type==='income'));
  const expenses=items.filter(t=>t.type==='expense');
  const spent=sum(expenses);
  const net=income-spent;
  $('#incomeTotal').textContent=fmt(income);
  $('#expenseTotal').textContent=fmt(spent);
  $('#netTotal').textContent=fmt(net);
  $('#netTotal').classList.toggle('negative',net<0);
  drawTransactions(items); drawCategories(expenses); drawBudget(spent);drawSavingsGoal(net);drawAnalytics(income, expenses);
}

$('#typeInput').addEventListener('change',refreshCategories);
$('#monthPicker').addEventListener('change',() => {
  if (!$('#monthPicker').value) $('#monthPicker').value=currentMonth();
  render();
});
$('#typeFilter').addEventListener('change',render);
$('#searchInput').addEventListener('input',render);

$('#transactionForm').addEventListener('submit',e => {
  e.preventDefault();
  const description=$('#nameInput').value.trim();
  const amount=Number($('#amountInput').value);
  const type=$('#typeInput').value;
  const category=$('#categoryInput').value;
  const date=$('#dateInput').value;
  if (!description || !Number.isFinite(amount) || amount<0.001 || amount>1000000
      || !categories[type]?.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
    message('Please enter a valid description, amount, category and date.',true); return;
  }
  const cents=Math.round(amount*1000)/1000;
  const next=[...transactions,{id:crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,description,amount:cents,type,category,date}];
  if (!safeSave(TX_KEY,next)) return;
  transactions=next;
  $('#transactionForm').reset(); $('#typeInput').value='expense'; refreshCategories();
  $('#dateInput').value=localDate();
  $('#monthPicker').value=date.slice(0,7);
 message('Successfully added to PocketWise! 💸'); render();
});

$('#budgetForm').addEventListener('submit',e=>{
  e.preventDefault();
  const amount=Number($('#budgetInput').value);
  if (!Number.isFinite(amount)||amount<0.001||amount>1000000) { alert('Enter a valid budget amount.'); return; }
  const next={...budgets,[$('#monthPicker').value]:Math.round(amount*1000)/1000};
  if (safeSave(BUDGET_KEY,next)) { budgets=next; render(); }
});
$('#savingsGoalForm').addEventListener('submit', e => {
  e.preventDefault();

  const amount = Number($('#savingsGoalInput').value);

  if (!Number.isFinite(amount) || amount < 0.001 || amount > 1000000) {
    alert('Enter a valid savings goal.');
    return;
  }

  const month = $('#monthPicker').value;

  const next = {
    ...savingsGoals,
    [month]: Math.round(amount * 1000) / 1000
  };

  if (safeSave(SAVINGS_KEY, next)) {
    savingsGoals = next;
    render();
  }
});

$('#demoButton').addEventListener('click',()=>{
  const month=$('#monthPicker').value;
  if (transactions.some(t=>t.date.startsWith(month))) {
    if (!window.confirm('Add sample transactions to this month alongside your existing entries?')) return;
  }
  const demos=[
    ['income','Monthly allowance',180,'Allowance',2],
    ['expense','University lunch',8.5,'Food & Drinks',4],
    ['expense','Bus card',15,'Transport',6],
    ['expense','Notebook and supplies',12.75,'University',8],
    ['expense','Coffee with friends',4.25,'Food & Drinks',10],
    ['expense','Movie night',9,'Entertainment',12]
  ];
  const next=[...transactions,...demos.map(([type,description,amount,category,day],i)=>({
    id:`demo-${Date.now()}-${i}`,type,description,amount,category,date:`${month}-${String(day).padStart(2,'0')}`
  }))];
  if (safeSave(TX_KEY,next)) { transactions=next;render(); }
});

$('#exportButton').addEventListener('click',()=>{
  const items=selectedTransactions();
  if (!items.length) { alert('There are no transactions to export for this month.'); return; }
  const escapeCSV=v=>`"${String(v).replaceAll('"','""')}"`;
  const lines=[['Date','Type','Description','Category','Amount JOD'],...items
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(t=>[t.date,t.type,t.description,t.category,t.amount.toFixed(3)])];
  const csv='\ufeff'+lines.map(row=>row.map(escapeCSV).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=`pocketwise-${$('#monthPicker').value}.csv`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
});

refreshCategories();
render();
