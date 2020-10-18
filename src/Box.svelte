<script>
  const height = 100 + 200 * Math.random()
  const randColor = () => Math.floor(Math.random() * 16777215).toString(16)
</script>

<div
  style="min-height: {height}px; background: linear-gradient(45deg, #{randColor()}, #{randColor()})">
  {Math.floor(height)}px
</div>

<style>
  div {
    display: grid;
    place-content: center;
    background: green;
    border-radius: 1ex;
  }
</style>
