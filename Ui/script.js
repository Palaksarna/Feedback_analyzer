
// In-memory storage for forms and responses
let forms = [];
let responses = {};
let currentFormId = null;
let questionIdCounter = 1;

// Initialize the application
function init() {
    loadForms();
    showDashboard();
}

// Navigation functions
function showSection(sectionId) {
    document.querySelectorAll('.main-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

function showDashboard() {
    showSection('dashboard');
    loadForms();
}

function goBackToDashboard() {
    showDashboard();
}

// Form management functions
function createNewForm() {
    currentFormId = null;
    document.getElementById('builderTitle').textContent = 'Create New Form';
    document.getElementById('formTitle').value = 'Untitled Form';
    document.getElementById('formDescription').value = '';
    document.getElementById('questionsContainer').innerHTML = '';
    questionIdCounter = 1;
    addQuestion(); // Add first question by default
    showSection('formBuilder');
}

function editForm(formId) {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    currentFormId = formId;
    document.getElementById('builderTitle').textContent = 'Edit Form';
    document.getElementById('formTitle').value = form.title;
    document.getElementById('formDescription').value = form.description;
    
    // Load questions
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    form.questions.forEach(question => {
        addQuestion(question);
    });
    
    showSection('formBuilder');
}

function saveForm() {
    const title = document.getElementById('formTitle').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    
    if (!title) {
        alert('Please enter a form title');
        return;
    }

    const questions = [];
    const questionElements = document.querySelectorAll('.question-item');
    
    questionElements.forEach(element => {
        const questionText = element.querySelector('.question-input').value.trim();
        const questionType = element.querySelector('.question-type').value;
        
        if (questionText) {
            const question = {
                id: element.dataset.questionId,
                text: questionText,
                type: questionType,
                options: []
            };
            
            if (questionType === 'radio' || questionType === 'checkbox') {
                const optionInputs = element.querySelectorAll('.option-input input');
                optionInputs.forEach(input => {
                    if (input.value.trim()) {
                        question.options.push(input.value.trim());
                    }
                });
            }
            
            questions.push(question);
        }
    });

    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    const formData = {
        id: currentFormId || Date.now().toString(),
        title,
        description,
        questions,
        createdAt: currentFormId ? forms.find(f => f.id === currentFormId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (currentFormId) {
        // Update existing form
        const index = forms.findIndex(f => f.id === currentFormId);
        forms[index] = formData;
    } else {
        // Create new form
        forms.push(formData);
        responses[formData.id] = [];
    }

    alert('Form saved successfully!');
    showDashboard();
}

function deleteForm(formId) {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
        forms = forms.filter(f => f.id !== formId);
        delete responses[formId];
        loadForms();
    }
}

function duplicateForm(formId) {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const newForm = {
        ...form,
        id: Date.now().toString(),
        title: form.title + ' (Copy)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    forms.push(newForm);
    responses[newForm.id] = [];
    loadForms();
}

// Question management functions
function addQuestion(questionData = null) {
    const questionId = questionData ? questionData.id : `q_${questionIdCounter++}`;
    const questionType = questionData ? questionData.type : 'text';
    const questionText = questionData ? questionData.text : '';
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.dataset.questionId = questionId;
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <input type="text" class="question-input" placeholder="Enter your question" value="${questionText}">
            <select class="question-type" onchange="updateQuestionType(this)">
                <option value="text" ${questionType === 'text' ? 'selected' : ''}>Short Answer</option>
                <option value="textarea" ${questionType === 'textarea' ? 'selected' : ''}>Paragraph</option>
                <option value="radio" ${questionType === 'radio' ? 'selected' : ''}>Multiple Choice</option>
                <option value="checkbox" ${questionType === 'checkbox' ? 'selected' : ''}>Checkboxes</option>
                <option value="dropdown" ${questionType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
            </select>
        </div>
        <div class="question-options"></div>
        <div class="question-actions">
            <button class="btn btn-delete" onclick="deleteQuestion(this)">🗑️ Delete</button>
        </div>
    `;
    
    document.getElementById('questionsContainer').appendChild(questionDiv);
    
    // Update question type to show options if needed
    updateQuestionType(questionDiv.querySelector('.question-type'));
    
    // Load existing options if any
    if (questionData && questionData.options) {
        const optionsContainer = questionDiv.querySelector('.question-options');
        questionData.options.forEach(option => {
            addOption(optionsContainer, option);
        });
    }
}

function updateQuestionType(select) {
    const questionDiv = select.closest('.question-item');
    const optionsContainer = questionDiv.querySelector('.question-options');
    const questionType = select.value;
    
    if (questionType === 'radio' || questionType === 'checkbox' || questionType === 'dropdown') {
        optionsContainer.innerHTML = '<button class="add-option-btn" onclick="addOption(this.parentElement)">➕ Add Option</button>';
        if (optionsContainer.children.length === 1) {
            addOption(optionsContainer, 'Option 1');
        }
    } else {
        optionsContainer.innerHTML = '';
    }
}

function addOption(container, optionText = '') {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input';
    optionDiv.innerHTML = `
        <span>○</span>
        <input type="text" placeholder="Option" value="${optionText}">
        <button class="btn btn-delete" onclick="removeOption(this)" style="padding: 4px 8px; margin-left: 8px;">✕</button>
    `;
    
    const addButton = container.querySelector('.add-option-btn');
    container.insertBefore(optionDiv, addButton);
}

function removeOption(button) {
    button.parentElement.remove();
}

function deleteQuestion(button) {
    if (confirm('Are you sure you want to delete this question?')) {
        button.closest('.question-item').remove();
    }
}

// Form viewing functions
function viewForm(formId) {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const content = document.getElementById('formViewContent');
    let html = `
        <h1>${form.title}</h1>
        <p class="form-description">${form.description}</p>
        <form id="responseForm" onsubmit="submitResponse(event, '${formId}')">
    `;

    form.questions.forEach(question => {
        html += `<div class="viewer-question">
            <h3>${question.text}</h3>`;
        
        switch(question.type) {
            case 'text':
                html += `<input type="text" name="q_${question.id}" required>`;
                break;
            case 'textarea':
                html += `<textarea name="q_${question.id}" required></textarea>`;
                break;
            case 'radio':
                html += '<div class="radio-group">';
                question.options.forEach((option, index) => {
                    html += `
                        <label class="radio-option">
                            <input type="radio" name="q_${question.id}" value="${option}" required>
                            <span>${option}</span>
                        </label>
                    `;
                });
                html += '</div>';
                break;
            case 'checkbox':
                html += '<div class="checkbox-group">';
                question.options.forEach((option, index) => {
                    html += `
                        <label class="checkbox-option">
                            <input type="checkbox" name="q_${question.id}" value="${option}">
                            <span>${option}</span>
                        </label>
                    `;
                });
                html += '</div>';
                break;
            case 'dropdown':
                html += `<select name="q_${question.id}" required>
                    <option value="">Choose an option</option>`;
                question.options.forEach(option => {
                    html += `<option value="${option}">${option}</option>`;
                });
                html += '</select>';
                break;
        }
        
        html += '</div>';
    });

    html += `
            <button type="submit" class="submit-btn">Submit Response</button>
        </form>
    `;

    content.innerHTML = html;
    showSection('formViewer');
}

function submitResponse(event, formId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const response = {
        id: Date.now().toString(),
        formId,
        submittedAt: new Date().toISOString(),
        answers: {}
    };

    for (let [key, value] of formData.entries()) {
        if (response.answers[key]) {
            // Handle multiple values (checkboxes)
            if (Array.isArray(response.answers[key])) {
                response.answers[key].push(value);
            } else {
                response.answers[key] = [response.answers[key], value];
            }
        } else {
            response.answers[key] = value;
        }
    }

    if (!responses[formId]) {
        responses[formId] = [];
    }
    responses[formId].push(response);

    alert('Response submitted successfully!');
    document.getElementById('responseForm').reset();
}

// Responses viewing functions
function viewResponses(formId) {
    const form = forms.find(f => f.id === formId);
    const formResponses = responses[formId] || [];
    
    if (!form) return;

    document.getElementById('responsesTitle').textContent = `${form.title} - Responses`;
    document.getElementById('responseCount').textContent = `${formResponses.length} response${formResponses.length !== 1 ? 's' : ''}`;
    
    const content = document.getElementById('responsesContent');
    
    if (formResponses.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <h3>No responses yet</h3>
                <p>Responses will appear here once people start submitting your form.</p>
            </div>
        `;
    } else {
        let html = '';
        formResponses.forEach((response, index) => {
            html += `
                <div class="response-card">
                    <div class="response-meta">
                        Response #${index + 1} • Submitted on ${new Date(response.submittedAt).toLocaleDateString()} at ${new Date(response.submittedAt).toLocaleTimeString()}
                    </div>
                    <div class="response-answers">
            `;
            
            form.questions.forEach(question => {
                const answer = response.answers[`q_${question.id}`];
                if (answer !== undefined) {
                    html += `
                        <div class="answer-item">
                            <div class="answer-question">${question.text}</div>
                            <div class="answer-text">${Array.isArray(answer) ? answer.join(', ') : answer}</div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = html;
    }
    
    showSection('responsesViewer');
}

// Dashboard functions
function loadForms() {
    const grid = document.getElementById('formsGrid');
    
    if (forms.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No forms yet</h3>
                <p>Click "Create New Form" to get started!</p>
            </div>
        `;
        return;
    }

    let html = '';
    forms.forEach(form => {
        const responseCount = responses[form.id] ? responses[form.id].length : 0;
        const createdDate = new Date(form.createdAt).toLocaleDateString();
        
        html += `
            <div class="form-card">
                <h3>${form.title}</h3>
                <p>${form.description || 'No description'}</p>
                <div class="form-stats">
                    <span>📊 ${responseCount} responses</span>
                    <span>📅 ${createdDate}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-edit" onclick="editForm('${form.id}')">✏️ Edit</button>
                    <button class="btn btn-view" onclick="viewForm('${form.id}')">👁️ View</button>
                    <button class="btn btn-responses" onclick="viewResponses('${form.id}')">📊 Responses</button>
                    <button class="btn btn-delete" onclick="deleteForm('${form.id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Sample data for demonstration
function loadSampleData() {
    const sampleForm = {
        id: 'sample_1',
        title: 'Customer Feedback Survey',
        description: 'Help us improve our services by sharing your feedback',
        questions: [
            {
                id: 'q1',
                text: 'How satisfied are you with our service?',
                type: 'radio',
                options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
            },
            {
                id: 'q2',
                text: 'What features would you like to see improved?',
                type: 'checkbox',
                options: ['User Interface', 'Performance', 'Customer Support', 'Documentation', 'Mobile App']
            },
            {
                id: 'q3',
                text: 'Please share any additional comments',
                type: 'textarea',
                options: []
            }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
    };

    const sampleResponses = [
        {
            id: 'r1',
            formId: 'sample_1',
            submittedAt: new Date(Date.now() - 3600000).toISOString(),
            answers: {
                'q_q1': 'Very Satisfied',
                'q_q2': ['User Interface', 'Performance'],
                'q_q3': 'Great service overall! Keep up the good work.'
            }
        },
        {
            id: 'r2',
            formId: 'sample_1',
            submittedAt: new Date(Date.now() - 7200000).toISOString(),
            answers: {
                'q_q1': 'Satisfied',
                'q_q2': ['Customer Support'],
                'q_q3': 'The support team was helpful, but response time could be faster.'
            }
        }
    ];

    forms.push(sampleForm);
    responses['sample_1'] = sampleResponses;
}

// Initialize the application when page loads
window.addEventListener('DOMContentLoaded', function() {
    // Load sample data for demonstration
    loadSampleData();
    init();
});

// Export functions for debugging (optional)
window.formBuilderApp = {
    forms,
    responses,
    exportData: () => JSON.stringify({ forms, responses }, null, 2),
    importData: (data) => {
        const parsed = JSON.parse(data);
        forms = parsed.forms || [];
        responses = parsed.responses || {};
        loadForms();
    }
};
