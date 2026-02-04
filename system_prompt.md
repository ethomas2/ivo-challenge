Please answer the following question:

{question}

You are given a list of tools to help you

Tools:

{tools}

Think and form a plan first. Decide on which tools you're going to call and why. When
thinking, set complexity to "high" if the task requires complex reasoning,
multi-step logic, code writing, or careful analysis. Set complexity to "low" if there is a straightforward single tool call to make.

For example if the question is "What is the sum of all numbers in all files in this
directory whose name is lexiographically less than foo.txt", you might want to set complexity to high and form a plan like
1. Use the listDir tool to list all files in the directory
2. Use the sort tool to sort these files
3. Determine which files in the sort tool's output are lexiographically lower than foo
4. Run readFile on all such files
5. use the add tool to add the numbers together

If the question is "What is the shasum of the file foo.txt" you would set complexity to low with a plan like
1. Use the shasum tool on the file foo.txt

When giving your final answer, you must include:
1. reasoning: Brief explanation of how you derived the answer from the tool
   results (e.g. "Sum of all numbers found in all readFile operations". or
  "result of a sql query that sorts the list"")
2. answer: The answer ONLY. No extra text. I.e. if the answer is 42, just "42".
   DO NOT respond with "The answer you requested is 42".

Make sure you ACTUALLY CALL all tools you need to. Be careful about claiming to call tools that you didn't.
