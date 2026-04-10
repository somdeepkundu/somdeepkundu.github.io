class Book:
    """
    A class to represent a book in the library.
    """
    def __init__(self, title, author, isbn):
        self.title = title
        self.author = author
        self.isbn = isbn
        self.is_available = True

    def borrow(self):
        """
        Mark the book as borrowed.
        """
        if self.is_available:
            self.is_available = False
            print(f"The book '{self.title}' has been borrowed.")
        else:
            print(f"Sorry, the book '{self.title}' is currently unavailable.")

    def return_book(self):
        """
        Mark the book as returned.
        """
        self.is_available = True
        print(f"The book '{self.title}' has been returned.")

    def __str__(self):
        return f"'{self.title}' by {self.author} (ISBN: {self.isbn})"


class Member:
    """
    A class to represent a library member.
    """
    def __init__(self, name, member_id):
        self.name = name
        self.member_id = member_id
        self.borrowed_books = []

    def borrow_book(self, book):
        """
        Borrow a book from the library.
        """
        if book.is_available:
            book.borrow()
            self.borrowed_books.append(book)
        else:
            print(f"Sorry, {self.name}, the book '{book.title}' is not available.")

    def return_book(self, book):
        """
        Return a borrowed book to the library.
        """
        if book in self.borrowed_books:
            book.return_book()
            self.borrowed_books.remove(book)
        else:
            print(f"{self.name} did not borrow the book '{book.title}'.")

    def __str__(self):
        return f"Member: {self.name} (ID: {self.member_id})"


class Library:
    """
    A class to represent a library.
    """
    def __init__(self):
        self.books = []
        self.members = []

    def add_book(self, book):
        """
        Add a book to the library.
        """
        self.books.append(book)
        print(f"The book '{book.title}' has been added to the library.")

    def register_member(self, member):
        """
        Register a new member in the library.
        """
        self.members.append(member)
        print(f"Member '{member.name}' has been registered.")

    def list_books(self):
        """
        List all books in the library.
        """
        print("Books in the library:")
        for book in self.books:
            status = "Available" if book.is_available else "Not Available"
            print(f"  - {book} ({status})")

    def __str__(self):
        return f"Library: {len(self.books)} books, {len(self.members)} members"


# Example usage
if __name__ == "__main__":
    # Create some books
    book1 = Book("1984", "George Orwell", "123456789")
    book2 = Book("To Kill a Mockingbird", "Harper Lee", "987654321")

    # Create a library
    library = Library()

    # Add books to the library
    library.add_book(book1)
    library.add_book(book2)

    # Register a member
    member = Member("Alice", "M001")
    library.register_member(member)

    # List all books in the library
    library.list_books()

    # Borrow a book
    member.borrow_book(book1)
    library.list_books()

    # Return the book
    member.return_book(book1)
    library.list_books()

