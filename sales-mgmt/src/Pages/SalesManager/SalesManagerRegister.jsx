
import RegisterForm from "../../components/RegisterForm"

const SalesManagerRegister = () => {
  return (
    <RegisterForm
      role="Sales Manager"
      successRedirect="/viewpipeline"
      accentColor="blue"
      requireCompanyVerification={true}
    />
  )
}

export default SalesManagerRegister
