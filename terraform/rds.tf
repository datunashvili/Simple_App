resource "aws_db_instance" "db" {
  engine = "postgres"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  username = "appuser"
  password = "changeme123"
  skip_final_snapshot = true
}