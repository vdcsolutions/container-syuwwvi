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
    multiple_pages: false,
    next_page_button_xpath: "",
    urls: [],
    nested: false,
    actions: [
      {
        type: "scrape",
        xpath: "",
        label: "",
        key: Date.now(),
      },
    ],
  });

  // Function to handle form submission
  const handleSubmit = () => {
  // Access the form data from the store
  const data = $formData;

  // Log the form data in JSON format
  console.log(JSON.stringify(data, null, 2));

  // Additional console.log to check if handleSubmit is called
  console.log("Form submitted!");
  };

  // Function to add a new action
  const addAction = () => {
    const newAction = {
      type: "job",
      xpath: "",
      label: "",
      key: Date.now(),
    };
    
    formData.update(data => {
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
        Next  Button XPath:
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
        <label>
          Label:
          <input type="text" bind:value={action.label} />
        </label>
        <button type="button" on:click={() => removeAction(action.key)}>Remove Action</button>
      </div>
    {/each}

    <!-- Add and Remove Action Buttons -->
    <button type="button" on:click={addAction}>Add Action</button>

    <button type="submit">Submit</button>
  </form>
</main>
