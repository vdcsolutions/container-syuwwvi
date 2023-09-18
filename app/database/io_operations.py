import json
import logging
from typing import Any, Dict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class IOOperations:
    @staticmethod
    def read_json(file_path: str) -> Dict[str, Any]:
        """
        Read data from a JSON file.

        :param file_path: The path to the JSON file
        :return: The data from the JSON file
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            logging.info(f"Successfully read data from {file_path}")
            return data
        except FileNotFoundError:
            logging.error(f"File not found: {file_path}")
            return {}
        except json.JSONDecodeError:
            logging.error(f"Failed to decode JSON from file: {file_path}")
            return {}

    @staticmethod
    def write_json(data: Dict[str, Any], file_path: str) -> None:
        """
        Write data to a JSON file.

        :param data: The data to write to the JSON file
        :param file_path: The path to the JSON file
        """
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
            logging.info(f"Successfully wrote data to {file_path}")
        except Exception as e:
            logging.error(f"Failed to write to file: {file_path}. Error: {e}")

# Usage example:
# io_operations = IOOperations()
# data = io_operations.read_json('path/to/your/file.json')
