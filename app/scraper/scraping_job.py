class ScrapingJob:
    def __init__(self, data: Dict, config: Optional[Dict] = None):
        """
        Initialize ScrapingJob instance.

        Parameters:
        - data (Dict): The data dictionary containing information for scraping.
        - config (Optional[Dict]): Optional configuration dictionary. Use only if nested.

        Returns:
        - None
        """
        self.data = data['payload']  # Data dictionary
        self.multiple_pages = self.data.get('multiple_pages', False)  # Default to False if not present
        self.nested = self.data.get('nested', False)  # Default to False if not present
        self.urls = self.data.get('urls')
        self.actions = self.data.get('actions')

        # Check if multiple pages and next_page_button_xpath are present in data
        if self.multiple_pages:
            self.next_page_button_xpath = self.data.get('next_page_button_xpath', None)

        # Check if nested and config are present in data
        if self.nested:
            if config is not None:
                self.config = config
            else:
                raise ValueError("Config is required for nested scraping.")
        else:
            self.config = self.data.get('config', None)

    def perform_actions(self):
        """
        Perform scraping actions based on the configuration.

        Returns:
        - None
        """
        for action in self.actions:
            if action['type'] == 'job':
                # Create a new ScrapingJob instance with the nested configuration
                nested_job = ScrapingJob(action, config=self.config)
                nested_job.perform_actions()  # Perform actions for the nested job
            elif action['type'] == 'click':
                self.click(action['xpath'])
            elif action['type'] == 'scrape':
                self.scrape(action['xpath'], action['label'])

    def click(self, xpath: str):
        """
        Simulate a click action.

        Parameters:
        - xpath (str): The XPath to the element to click.

        Returns:
        - None
        """
        # Implement your logic to simulate a click action

    def scrape(self, xpath: str, label: str):
        """
        Perform scraping based on the provided XPath.

        Parameters:
        - xpath (str): The XPath to the element to scrape.
        - label (str): A label for the scraped data.

        Returns:
        - None
        """
        # Implement your logic to perform scraping based on the provided XPath
        # Use the 'label' to identify or label the scraped data

# Instantiate the ScrapingJob
scraper = ScrapingJob(payload_data)
scraper.perform_actions()  # Perform actions based on the configured data
