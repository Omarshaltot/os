const memory = [50, 100, 350, 500];
const process = Array(memory.length).fill([]); // Initialize process array with empty arrays
let remainingMemory = [...memory]; // Track remaining memory in each block

function bestFit() {
    const input = parseInt(document.getElementById("input").value);

    let closestIndex = -1;
    let closestDiff = Infinity;

    for (let i = 0; i < remainingMemory.length; i++) {
        if (remainingMemory[i] >= input) { // Check if block has enough remaining memory
            const diff = remainingMemory[i] - input;
            if (diff < closestDiff) {
                closestIndex = i;
                closestDiff = diff;
            }
        }
    }

    if (closestIndex === -1) {
        alert("No suitable memory block available. All memory is full.");
        return;
    }

    remainingMemory[closestIndex] -= input; // Deduct the allocated memory from the block
    process[closestIndex] = [...process[closestIndex], input]; // Add the process to the block
    updateTable(closestIndex, process[closestIndex].join('-')); // Update the HTML table
    console.log(`Process of size ${input} added at index ${closestIndex}. Remaining memory: ${remainingMemory[closestIndex]}`);
}