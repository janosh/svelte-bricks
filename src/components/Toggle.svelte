<script lang="ts">
  export let name: string
  export let checked = false
  export let required = false

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === `Enter`) {
      event.preventDefault()
      checked = !checked
    }
  }
</script>

<label for={name}>
  <input
    type="checkbox"
    id={name}
    {name}
    bind:checked
    {required}
    on:keydown={handleKeydown} />
  <span />
</label>

<style>
  label {
    display: inline-flex;
    align-items: center;
    width: max-content;
    padding: 1ex;
    vertical-align: -30%;
  }
  span {
    height: 1.3em;
    width: 2.3em;
    padding: 0.1em;
    box-sizing: border-box;
    border: 1px solid gray;
    border-radius: 0.75em;
    transition: 0.3s;
  }
  input:checked + span {
    background: black;
  }
  input {
    position: absolute;
    opacity: 0;
    width: 1em;
  }
  input + span::after {
    content: '';
    display: block;
    height: 1em;
    width: 1em;
    border-radius: 50%;
    background: red;
    transition: 0.3s;
  }
  input:checked + span::after {
    background: green;
    transform: translate(100%);
  }
  input:focus + span {
    border: 1px solid cornflowerblue;
  }
</style>
