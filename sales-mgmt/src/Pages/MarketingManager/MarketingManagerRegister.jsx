
import RegisterForm from "../../components/RegisterForm"

const MarketingManagerRegister = () => {
  return (
    <RegisterForm
      role="Marketing Manager"
      successRedirect="/addnewlead"
      accentColor="green"
      requireCompanyVerification={true}
    />
  )
}

export default MarketingManagerRegister
