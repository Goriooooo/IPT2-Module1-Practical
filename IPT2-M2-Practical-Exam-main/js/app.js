<<<<<<< HEAD
// Subject functionality
document.addEventListener('DOMContentLoaded', () => {
    // Student section (keep existing)
    if (document.getElementById('addStudentButton')) {
        document.getElementById('addStudentButton').addEventListener('click', addStudent);
        displayStudents();
    }

    // Subject section
    if (document.getElementById('addSubject')) {
        document.getElementById('addSubject').addEventListener('click', addSubject);
        displaySubjects();
    }
});

function addSubject() {
    const subjectCode = document.getElementById('subjectCode').value.trim();
    const subjectName = document.getElementById('subjectName').value.trim();
    const units = document.getElementById('units').value.trim();

    if (!subjectCode || !subjectName || !units) {
        alert('Please fill in all fields.');
        return;
    }

    // Get existing subjects from localStorage or initialize empty array
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

    // Optional: Prevent duplicate subject codes
    if (subjects.some(s => s.subjectCode === subjectCode)) {
        alert('Subject code already exists!');
        return;
    }

    // Add new subject
    subjects.push({
        subjectCode: subjectCode,
        subjectName: subjectName,
        units: units
    });

    // Save back to localStorage
    localStorage.setItem('subjects', JSON.stringify(subjects));

    // Clear form
    document.getElementById('subjectCode').value = '';
    document.getElementById('subjectName').value = '';
    document.getElementById('units').value = '';

    // Refresh table
    displaySubjects();

    alert('Subject added successfully!');
}

function displaySubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const tableContent = document.getElementById('table-content');
    if (!tableContent) return;

    tableContent.innerHTML = subjects.map(subject => `
        <tr>
            <td>${subject.subjectCode}</td>
            <td>${subject.subjectName}</td>
            <td>${subject.units}</td>
        </tr>
    `).join('');
}
=======
// Initialize event listener when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addStudentButton').addEventListener('click', addStudent);
    displayStudents(); // Show existing students on page load
});

function addStudent() {
    // Get input values
    const idNumber = document.getElementById('idNumber').value;
    const firstName = document.getElementById('firstName').value;
    const middleName = document.getElementById('middleName').value;
    const lastName = document.getElementById('lastName').value;

    // Validate inputs
    if (!idNumber || !firstName || !lastName) {
        alert('Please fill in all required fields (ID Number, First Name, and Last Name)');
        return;
    }

    // Create student object
    const student = {
        idNumber: idNumber,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName
    };

    // Get existing students from localStorage or initialize empty array
    let students = JSON.parse(localStorage.getItem('students')) || [];

    // Check if student ID already exists
    if (students.some(s => s.idNumber === idNumber)) {
        alert('Student ID already exists!');
        return;
    }

    // Add new student to array
    students.push(student);

    // Save updated array back to localStorage
    localStorage.setItem('students', JSON.stringify(students));

    // Clear form
    document.getElementById('studentForm').reset();

    // Refresh student list display
    displayStudents();

    alert('Student added successfully!');
}

function displayStudents() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const tableContent = document.getElementById('table-content');
    
    tableContent.innerHTML = students.map(student => `
        <tr>
            <td>${student.idNumber}</td>
            <td>${student.firstName}</td>
            <td>${student.middleName || ''}</td>
            <td>${student.lastName}</td>
        </tr>
    `).join('');
}
>>>>>>> 269066d26a9ba99d5304a306e903b32dde7aa02d
