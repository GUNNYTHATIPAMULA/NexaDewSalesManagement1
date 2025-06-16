"use client"

import RegisterForm from "../../components/RegisterForm"

const CompanyOwnerRegister = () => {
  return (
    <RegisterForm
      role="Company Owner"
      successRedirect="/"
      accentColor="purple"
      requireCompanyVerification={false}
    />
  )
}

export default CompanyOwnerRegister
