class ReportGradingSystem {
    constructor() {
        this.reports = [];
        this.grades = JSON.parse(localStorage.getItem('reportGrades')) || {};
        this.currentReport = null;
        this.init();
    }

    init() {
        this.loadReports();
        this.setupEventListeners();
        this.setupStarRatings();
        this.updateGradedList();
    }

    loadReports() {
        const reportFiles = [
            'B1_089.pdf', 'B1_558.pdf', 'B1_604.pdf', 'B1_758.pdf', 'B1_913.pdf',
            'B2_203.pdf', 'B2_429.pdf', 'B2_665.pdf', 'B2_718.pdf', 'B2_733.pdf',
            'B3_027.pdf', 'B3_238.pdf', 'B3_517.pdf', 'B3_574.pdf', 'B3_616.pdf',
            'B4_225.pdf', 'B4_284.pdf', 'B4_459.pdf', 'B4_603.pdf', 'B4_828.pdf',
            'B5_030.pdf', 'B5_032.pdf', 'B5_095.pdf', 'B5_223.pdf', 'B5_432.pdf'
        ];

        this.reports = reportFiles.map(file => ({
            name: file,
            path: `reports/${file}`,
            displayName: file.replace('.pdf', '')
        }));

        this.renderReportList();
    }

    renderReportList() {
        const reportList = document.getElementById('reportList');
        reportList.innerHTML = '';

        this.reports.forEach(report => {
            const li = document.createElement('li');
            li.className = 'report-item';
            
            const isGraded = this.grades[report.name];
            if (isGraded) {
                li.classList.add('graded');
            }

            li.innerHTML = `
                <span class="report-name">${report.displayName}</span>
                ${isGraded ? '<span class="graded-indicator">✓</span>' : ''}
            `;
            
            li.addEventListener('click', () => this.selectReport(report));
            reportList.appendChild(li);
        });
    }

    selectReport(report) {
        this.currentReport = report;
        
        // Update UI
        document.getElementById('currentReportName').textContent = `Grading: ${report.displayName}`;
        document.getElementById('reportFrame').src = report.path;
        
        // Clear form if not already graded
        if (!this.grades[report.name]) {
            this.clearForm();
        } else {
            this.loadExistingGrade(report.name);
        }

        // Update selected report in list
        document.querySelectorAll('.report-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.closest('.report-item').classList.add('selected');
    }

    clearForm() {
        // Reset all star ratings
        document.querySelectorAll('.star-rating').forEach(rating => {
            rating.dataset.rating = '0';
            rating.querySelectorAll('.star').forEach(star => {
                star.classList.remove('filled');
            });
            const display = rating.parentNode.querySelector('.rating-display');
            if (display) display.textContent = '0/10';
        });
    }

    loadExistingGrade(reportName) {
        const grade = this.grades[reportName];
        if (grade) {
            this.setStarRating('modelCompleteness', grade.modelCompleteness);
            this.setStarRating('simulationResults', grade.simulationResults);
            this.setStarRating('explanation', grade.explanation);
            this.setStarRating('expertSimilarity', grade.expertSimilarity);
        }
    }

    setupEventListeners() {
        document.getElementById('gradingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitGrade();
        });

        document.getElementById('downloadCSV').addEventListener('click', () => {
            this.downloadCSV();
        });

        // Clear all data on page load to start fresh
        this.clearAllData();
    }

    setupStarRatings() {
        document.querySelectorAll('.star-rating').forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            const field = rating.dataset.field;
            const display = rating.parentNode.querySelector('.rating-display');

            stars.forEach((star, index) => {
                // Click handler
                star.addEventListener('click', () => {
                    const value = parseInt(star.dataset.value);
                    this.setStarRating(field, value);
                });

                // Hover handlers
                star.addEventListener('mouseenter', () => {
                    const value = parseInt(star.dataset.value);
                    this.highlightStars(rating, value);
                });
            });

            // Reset hover effect when leaving the rating container
            rating.addEventListener('mouseleave', () => {
                this.resetHoverEffect(rating);
            });
        });
    }

    setStarRating(field, value) {
        const rating = document.querySelector(`[data-field="${field}"]`);
        const stars = rating.querySelectorAll('.star');
        const display = rating.parentNode.querySelector('.rating-display');
        
        rating.dataset.rating = value;
        display.textContent = `${value}/10`;
        
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    }

    highlightStars(rating, value) {
        const stars = rating.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.remove('hover-fill');
            if (index < value) {
                star.classList.add('hover-fill');
            }
        });
    }

    resetHoverEffect(rating) {
        const stars = rating.querySelectorAll('.star');
        stars.forEach(star => {
            star.classList.remove('hover-fill');
        });
    }

    submitGrade() {
        if (!this.currentReport) {
            alert('Please select a report first');
            return;
        }

        // Get ratings from star rating components
        const modelCompleteness = parseInt(document.querySelector('[data-field="modelCompleteness"]').dataset.rating);
        const simulationResults = parseInt(document.querySelector('[data-field="simulationResults"]').dataset.rating);
        const explanation = parseInt(document.querySelector('[data-field="explanation"]').dataset.rating);
        const expertSimilarity = parseInt(document.querySelector('[data-field="expertSimilarity"]').dataset.rating);

        const grade = {
            reportName: this.currentReport.name,
            modelCompleteness,
            simulationResults,
            explanation,
            expertSimilarity,
            timestamp: new Date().toISOString()
        };

        // Validate all fields are filled (greater than 0)
        if (!modelCompleteness || !simulationResults || !explanation || !expertSimilarity) {
            alert('Please rate all criteria (click on stars to rate 1-10)');
            return;
        }

        // Save grade
        this.grades[this.currentReport.name] = grade;
        localStorage.setItem('reportGrades', JSON.stringify(this.grades));

        // Update UI
        this.renderReportList();
        this.updateGradedList();
        
        alert('Grade submitted successfully!');
    }

    updateGradedList() {
        const gradedList = document.getElementById('gradedList');
        gradedList.innerHTML = '';

        Object.keys(this.grades).forEach(reportName => {
            const grade = this.grades[reportName];
            const li = document.createElement('li');
            li.className = 'graded-item';
            
            const avgScore = ((grade.modelCompleteness + grade.simulationResults + grade.explanation + grade.expertSimilarity) / 4).toFixed(1);
            
            li.innerHTML = `
                <div class="graded-report-name">${reportName.replace('.pdf', '')}</div>
                <div class="graded-scores">
                    <small>MC: ${grade.modelCompleteness}, SR: ${grade.simulationResults}, EX: ${grade.explanation}, ES: ${grade.expertSimilarity}</small>
                    <div class="avg-score">Avg: ${avgScore}</div>
                </div>
            `;
            
            gradedList.appendChild(li);
        });
    }

    downloadCSV() {
        if (Object.keys(this.grades).length === 0) {
            alert('No grades available to download');
            return;
        }

        const headers = ['Report Name', 'Model Completeness', 'Simulation Results', 'Explanation (Clarity)', 'Similarity to Expert Report', 'Average Score', 'Timestamp'];
        const csvData = [headers];

        Object.keys(this.grades).forEach(reportName => {
            const grade = this.grades[reportName];
            const avgScore = ((grade.modelCompleteness + grade.simulationResults + grade.explanation + grade.expertSimilarity) / 4).toFixed(2);
            
            csvData.push([
                reportName,
                grade.modelCompleteness,
                grade.simulationResults,
                grade.explanation,
                grade.expertSimilarity,
                avgScore,
                grade.timestamp
            ]);
        });

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_grades_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    clearAllData() {
        // Clear localStorage
        localStorage.removeItem('reportGrades');
        this.grades = {};
        
        // Clear any cached data
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReportGradingSystem();
});