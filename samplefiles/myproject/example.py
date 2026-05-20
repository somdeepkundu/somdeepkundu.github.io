
class MyClass:
    """A simple example class."""
    
    def __init__(self, name):
        """
        Initialize the class.
        
        Args:
            name (str): The name of the object.
        """
        self.name = name

    def greet(self):
        """Return a greeting message."""
        return f"Hello, {self.name}!"

