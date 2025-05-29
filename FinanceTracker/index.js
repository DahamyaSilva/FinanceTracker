class FinanceTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.chart = null;
        this.initializeEventListeners();
        this.setTodayDate();
        this.updateDisplay();
    }

    loadTransactions() {
        return JSON.parse(localStorage.getItem('transactions') || '[]');
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    setTodayDate() {
        document.getElementById('date').valueAsDate = new Date();
    }

    initializeEventListeners() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        document.getElementById('filterType').addEventListener('change', () => this.updateDisplay());
        document.getElementById('filterCategory').addEventListener('change', () => this.updateDisplay());
        document.getElementById('searchInput').addEventListener('input', () => this.updateDisplay());
    }

    addTransaction() {
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id: Date.now(),
            description,
            amount,
            type,
            category,
            date,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDisplay();
        document.getElementById('transactionForm').reset();
        this.setTodayDate();
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDisplay();
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm) ||
                t.category.toLowerCase().includes(searchTerm)
            );
        }

        return filtered;
    }

    updateStats() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `$${balance.toFixed(2)}`;
    }

    updateTransactionsList() {
        const filtered = this.getFilteredTransactions();
        const container = document.getElementById('transactionsList');
    
        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-data">No transactions match your filters.</div>';
            return;
        }
    
        container.innerHTML = filtered.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <p>${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </span>
                    <button class="delete-btn" data-id="${transaction.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    
        // Add event delegation for delete buttons
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                this.deleteTransaction(id);
            }
        });
    }

    updateChart() {
        const expenses = this.transactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }

        const categoryTotals = {};
        expenses.forEach(transaction => {
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        const ctx = document.getElementById('categoryChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateDisplay() {
        this.updateStats();
        this.updateTransactionsList();
        this.updateChart();
    }
}

// Initialize the app
const tracker = new FinanceTracker();