require("dotenv").config();
const mongoose = require("mongoose");

const problems = [
    {
        main: {
            id: 1,
            name: "two-sum",
            difficulty: "easy",
            like_count: 0,
            dislike_count: 0,
            description_body: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers whose sum is \`target\`.\n\nYou may assume exactly one solution exists, and you may not use the same element twice. Return the indices in either order.\n\n**Example 1**\n\n\`\`\`text\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nExplanation: nums[0] + nums[1] equals 9.\n\`\`\`\n\n**Example 2**\n\n\`\`\`text\nInput: nums = [3, 2, 4], target = 6\nOutput: [1, 2]\n\`\`\`\n\nImplement \`twoSum(nums, target)\` in JavaScript.`,
            accept_count: 0,
            submission_count: 0,
            acceptance_rate_count: 0,
            discussion_count: 0,
            related_topics: ["Array", "Hash Table"],
            similar_questions: [],
            solution_count: 0,
            code_default_language: "javascript",
            code_body: {
                javascript: "function twoSum(nums, target) {\n    // Return the indices of the two values that add up to target.\n    \n}\n",
            },
        },
        editorial: {
            editorial_body: "Store each number's index in a map. For each number, check whether its complement (`target - number`) has already been seen. If so, return the saved index and the current index. This runs in linear time.",
        },
        function_name: "twoSum",
        test: [
            [[2, 7, 11, 15], 9, [0, 1]],
            [[3, 2, 4], 6, [1, 2]],
            [[3, 3], 6, [0, 1]],
        ],
    },
    {
        main: {
            id: 2,
            name: "reverse-string",
            difficulty: "easy",
            like_count: 0,
            dislike_count: 0,
            description_body: `Given a string \`text\`, return a new string with its characters in reverse order.\n\n**Example 1**\n\n\`\`\`text\nInput: text = "hello"\nOutput: "olleh"\n\`\`\`\n\n**Example 2**\n\n\`\`\`text\nInput: text = "FireCode"\nOutput: "edoCeriF"\n\`\`\`\n\nImplement \`reverseString(text)\` in JavaScript.`,
            accept_count: 0,
            submission_count: 0,
            acceptance_rate_count: 0,
            discussion_count: 0,
            related_topics: ["String"],
            similar_questions: [],
            solution_count: 0,
            code_default_language: "javascript",
            code_body: {
                javascript: "function reverseString(text) {\n    // Return text with its characters reversed.\n    \n}\n",
            },
        },
        editorial: {
            editorial_body: "Strings can be reversed by splitting them into characters, reversing the array, and joining it back into a string: `text.split(\"\").reverse().join(\"\")`.",
        },
        function_name: "reverseString",
        test: [
            ["hello", "olleh"],
            ["FireCode", "edoCeriF"],
            ["a", "a"],
        ],
    },
    {
        main: {
            id: 3,
            name: "palindrome-number",
            difficulty: "easy",
            like_count: 0,
            dislike_count: 0,
            description_body: `Given an integer \`number\`, return \`true\` if it reads the same forward and backward, and \`false\` otherwise. Negative numbers are not palindromes.\n\n**Example 1**\n\n\`\`\`text\nInput: number = 121\nOutput: true\n\`\`\`\n\n**Example 2**\n\n\`\`\`text\nInput: number = -121\nOutput: false\n\`\`\`\n\nImplement \`isPalindrome(number)\` in JavaScript.`,
            accept_count: 0,
            submission_count: 0,
            acceptance_rate_count: 0,
            discussion_count: 0,
            related_topics: ["Math"],
            similar_questions: [],
            solution_count: 0,
            code_default_language: "javascript",
            code_body: {
                javascript: "function isPalindrome(number) {\n    // Return whether number reads the same in both directions.\n    \n}\n",
            },
        },
        editorial: {
            editorial_body: "Convert the number to a string and compare it with its reversed characters. A negative number includes a minus sign on only one side, so it correctly returns false.",
        },
        function_name: "isPalindrome",
        test: [
            [121, true],
            [-121, false],
            [10, false],
            [0, true],
        ],
    },
];

async function seedProblems() {
    if (!process.env.MONGODB_URI) {
        console.error("Missing required environment variable: MONGODB_URI");
        process.exitCode = 1;
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collection = mongoose.connection.collection("problems");

        for (const problem of problems) {
            await collection.updateOne(
                { "main.name": problem.main.name },
                { $set: problem },
                { upsert: true }
            );
        }

        console.log(`Seeded ${problems.length} starter problems.`);
    } catch {
        console.error("Problem seeding failed. Check MONGODB_URI and network access.");
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

void seedProblems();
