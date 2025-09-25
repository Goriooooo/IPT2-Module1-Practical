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
