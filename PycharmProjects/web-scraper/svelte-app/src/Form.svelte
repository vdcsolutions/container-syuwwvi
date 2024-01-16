<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  // Create a writable store to hold form data
  const formData = writable({
    config: {
      headless: false,
      proxy: "",
      waitTime: 1,
      browser: "",
    },
    type: "job",
    multiple_pages: false,
    next_page_button_xpath: "",
    urls: "https://www.znanylekarz.pl/magdalena-franiel/stomatolog/zory#address-id=%5B273354%5D&filters%5Bspecializations%5D%5B%5D=103\nhttps://www.znanylekarz.pl/barbara-sleziona/stomatolog/zory#address-id=%5B443028%5D&filters%5Bspecializations%5D%5B%5D=103",

    nested: false,
    actions: [
      {
        type: "click",
        xpath: "//button[@id='onetrust-accept-btn-handler']",
        page: null, // No default page
        key: 1,
        label: "",
      },
      {
        type: "scrape",
        xpath: "//div[@data-id='profile-fullname-wrapper']",
        label: "name",
        page: null, // No default page
        key: 2,
      },
    ],
  });


  // Create a writable store for the response
  const responseMessage = writable("");
  const responseBody = writable("");

  // Function to handle form submission
  // Function to handle form submission
  const handleSubmit = async () => {
    // Access the form data from the store
    let data = $formData;

    // Ensure that data.urls is a string before splitting
    data.urls = typeof data.urls === 'string' ? data.urls.split('\n').filter(url => url.trim() !== '') : [];

    try {
      // Post the form data to http://127.0.0.1:8000/scrape
      const response = await fetch('http://127.0.0.1:8000/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload: data }),
      });

      if (response.ok) {
        const responseBodyData = await response.json();
        responseMessage.set(responseBodyData.message || 'Form data submitted successfully!');
        responseBody.set(responseBodyData);  // Set the response body data to the store
      } else {
        console.error(`Form submission failed with status: ${response.status}`);
        responseMessage.set(`Form submission failed with status: ${response.status}`);
        responseBody.set("");  // Clear the response body in case of an error
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      responseMessage.set('Error during form submission');
      responseBody.set("");  // Clear the response body in case of an error
    }
  };

  // Function to add a new action
  const addAction = () => {
    const newAction = {
      type: "job",
      xpath: "",
      label: "",
      page: "", // No default page
      key: Date.now(),
    };

    formData.update((data) => {
      data.actions = [...data.actions, newAction];
      return data;
    });
  };

  // Function to remove an action
  const removeAction = (key) => {
    formData.update((data) => {
      data.actions = data.actions.filter((action) => action.key !== key);
      return data;
    });
  };

  // Load initial data if needed
  onMount(() => {
    // Load data from the payload or any other source
    // Example: formData.set({ ...initialData });
  });
</script>
<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  form {
    border: 1px solid #ccc;
    padding: 20px;
    max-width: 400px; /* Adjust the width as needed */
    width: 100%;
    display: flex;
    flex-direction: column; /* Place form elements in a column */
    margin-bottom: 20px;
  }

  label {
    margin-bottom: 10px;
  }

  input, select, textarea {
    width: 100%;
    padding: 8px;
    margin-bottom: 15px; /* Add separation between input boxes */
    box-sizing: border-box;
  }

  button {
    margin-top: 10px;
  }

  .response {
    margin-top: 20px;
    width: 100%;
    max-width: 600px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #f9f9f9;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .error {
    color: red; /* Change the color as needed */
  }
</style>

<main>
  <form on:submit|preventDefault={handleSubmit}>
    <!-- Config -->
    <label>
      Headless:
      <input type="checkbox" bind:checked={$formData.config.headless} />
    </label>
    <label>
      Proxy:
      <input type="text" bind:value={$formData.config.proxy} />
    </label>
    <label>
      Wait Time:
      <input type="number" bind:value={$formData.config.waitTime} />
    </label>

    <!-- Job -->
    <label>
      Multiple Pages:
      <input type="checkbox" bind:checked={$formData.multiple_pages} />
    </label>
    {#if $formData.multiple_pages}
      <label>
        Next Button XPath:
        <input type="text" bind:value={$formData.next_page_button_xpath} />
      </label>
    {/if}
    <label>
      URLs:
      <textarea bind:value={$formData.urls}></textarea>
    </label>
    <label>
      Nested:
      <input type="checkbox" bind:checked={$formData.nested} />
    </label>

    <!-- Actions -->
    {#each $formData.actions as action (action.key)}
      <div>
        <label>
          Action Type:
          <select bind:value={action.type}>
            <option value="job">Job</option>
            <option value="click">Click</option>
            <option value="scrape">Scrape</option>
          </select>
        </label>
        <label>
          XPath:
          <input type="text" bind:value={action.xpath} />
        </label>

        {#if action.type === 'click' || action.type === 'scrape'}
          <label>
            Page:
            <input type="text" bind:value={action.page} />
          </label>
        {/if}
        {#if action.type === 'scrape'}
          <label>
            Label:
            <input type="text" bind:value={action.label} />
          </label>
        {/if}
        <button type="button" on:click={() => removeAction(action.key)}>Remove Action</button>
      </div>
    {/each}

    <!-- Add and Remove Action Buttons -->
    <button type="button" on:click={addAction}>Add Action</button>

    <button type="submit">Submit</button>
  </form>

  {#if $responseMessage}
    <p>{$responseMessage}</p>
  {/if}
  {#if $responseBody}
    <pre>{$responseBody}</pre>
  {/if}
</main>
