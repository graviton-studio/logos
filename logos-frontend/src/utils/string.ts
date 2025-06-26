/**
 * Converts a snake_case string to Title Case With Spaces
 * @param snakeCase - The snake_case string to convert
 * @returns The converted string in Title Case With Spaces
 * @example
 * snakeToTitleCase('hello_world') // returns 'Hello World'
 * snakeToTitleCase('user_first_name') // returns 'User First Name'
 */
export function snakeToTitleCase(snakeCase: string): string {
  return snakeCase
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
